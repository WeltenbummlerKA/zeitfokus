"""Upgrade only generated v0.8.3 data copies; never accepts a production data path."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import secrets
import shutil
import signal
import socket
import sqlite3
import subprocess
import tempfile
import time
import urllib.request

parser = argparse.ArgumentParser()
parser.add_argument('--fixture-go', default='go')
target = parser.add_mutually_exclusive_group(required=True)
target.add_argument('--image')
target.add_argument('--binary')
parser.add_argument('--server-binary')
args = parser.parse_args()
if args.binary and not args.server_binary:
    parser.error('--binary requires --server-binary')
repository = Path(__file__).resolve().parent.parent

def free_port():
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        return sock.getsockname()[1]

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def connect(path):
    return sqlite3.connect('file:' + str(path) + '?mode=ro', uri=True)

def business_rows(path, columns=None):
    result = {}
    with connect(path) as db:
        for table in ['users', 'time_spans', 'time_span_tags', 'tag_definitions', 'dashboards', 'dashboard_ranges', 'dashboard_entries', 'user_settings']:
            selected = '*' if columns is None else ','.join('"' + column + '"' for column in columns[table])
            result[table] = db.execute('SELECT ' + selected + ' FROM ' + table + ' ORDER BY rowid').fetchall()
    return result

with tempfile.TemporaryDirectory(prefix='zeitfokus-legacy-upgrade-') as directory:
    root = Path(directory)
    original = root / 'original-v083'
    upgraded = root / 'candidate-copy'
    password = secrets.token_urlsafe(24)
    other_password = secrets.token_urlsafe(24)
    admin_token, other_token, expired_token = [secrets.token_hex(10) for _ in range(3)]
    favorites_token = secrets.token_urlsafe(32)
    env = os.environ.copy()
    env.update(FIXTURE_DIRECTORY=str(original), FIXTURE_PASSWORD=password, FIXTURE_OTHER_PASSWORD=other_password, FIXTURE_ADMIN_TOKEN=admin_token, FIXTURE_OTHER_TOKEN=other_token, FIXTURE_EXPIRED_TOKEN=expired_token, GOTOOLCHAIN='local')
    subprocess.run([args.fixture_go, '-C', str(repository / 'tests/legacy_fixture'), 'run', '.'], env=env, check=True)
    original_digest = sha(original / 'traggo.db')
    original_favorites = (original / 'favorites.json').read_bytes()
    expected_rows = business_rows(original / 'traggo.db')
    with connect(original / 'traggo.db') as db:
        original_columns = {table: [row[1] for row in db.execute('PRAGMA table_info(' + table + ')')] for table in expected_rows}
    shutil.copytree(original, upgraded)
    container = None
    process = None
    log = open(root / 'candidate.log', 'w')
    try:
        if args.image:
            envfile = root / 'candidate.env'
            envfile.write_text('ZEITFOKUS_DEFAULT_USER_PASS=' + secrets.token_urlsafe(24) + '\nZEITFOKUS_FAVORITES_TOKEN=' + favorites_token + '\n')
            envfile.chmod(0o600)
            container = 'zeitfokus-legacy-test-' + secrets.token_hex(6)
            subprocess.run(['docker', 'run', '-d', '--name', container, '--user', str(os.getuid()) + ':' + str(os.getgid()), '--env', 'HOME=/tmp', '--read-only', '--tmpfs', '/tmp', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges:true', '--env-file', str(envfile), '--mount', 'type=bind,src=' + str(upgraded) + ',dst=/opt/zeitfokus/data', '-p', '127.0.0.1::3030', '-p', '127.0.0.1::3031', args.image], check=True, stdout=subprocess.DEVNULL)
            def address(port):
                return 'http://' + subprocess.check_output(['docker', 'port', container, str(port) + '/tcp'], text=True).strip()
            base, favorites_base = address(3030), address(3031)
        else:
            port, favorites_port = free_port(), free_port()
            runtime = env.copy()
            runtime.update(ZEITFOKUS_BINARY=args.server_binary, ZEITFOKUS_PORT=str(port), ZEITFOKUS_DEFAULT_USER_PASS=secrets.token_urlsafe(24), ZEITFOKUS_DATABASE_CONNECTION=str(upgraded / 'traggo.db'), ZEITFOKUS_FAVORITES_ADDR='127.0.0.1:' + str(favorites_port), ZEITFOKUS_FAVORITES_TOKEN=favorites_token, ZEITFOKUS_FAVORITES_STORE=str(upgraded / 'favorites.json'))
            process = subprocess.Popen([args.binary], env=runtime, cwd=upgraded, stdout=log, stderr=log)
            base, favorites_base = 'http://127.0.0.1:' + str(port), 'http://127.0.0.1:' + str(favorites_port)
        def gql(query, token=None, variables=None, allow_errors=False):
            headers = {'Content-Type': 'application/json'}
            if token:
                headers['Authorization'] = 'traggo ' + token
            request = urllib.request.Request(base + '/graphql', json.dumps({'query': query, 'variables': variables or {}}).encode(), headers)
            with urllib.request.urlopen(request, timeout=10) as response:
                result = json.load(response)
            if not allow_errors:
                assert not result.get('errors'), 'GraphQL operation failed'
            return result
        for attempt in range(150):
            try:
                gql('{version{name}}')
                break
            except OSError:
                time.sleep(.2)
        else:
            raise RuntimeError('candidate did not start')
        assert gql('{currentUser{id name}}', admin_token)['data']['currentUser'] == {'id': 1, 'name': 'legacy-admin'}
        rows = gql('{timeSpans{timeSpans{id start end note tags{key value}}}}', admin_token)['data']['timeSpans']['timeSpans']
        by_id = {row['id']: row for row in rows}
        assert set(by_id) == {1, 2}, 'lost rows or cross-user data leak'
        assert by_id[1]['start'] == '2026-10-24T10:30:00+02:00' and by_id[2]['start'] == '2026-10-26T10:30:00+01:00'
        assert by_id[1]['note'] == 'Before DST' and by_id[2]['note'] == 'After DST'
        assert by_id[1]['tags'] == [{'key': 'project', 'value': 'legacy'}]
        timers = gql('{timers{id note}}', admin_token)['data']['timers']
        assert timers == [{'id': 3, 'note': 'Legacy running timer'}]
        other = gql('{timeSpans{timeSpans{id}}}', other_token)['data']['timeSpans']['timeSpans']
        assert other == [{'id': 4}], 'other user isolation failed'
        assert gql('{currentUser{id}}', expired_token)['data']['currentUser'] is None
        dashboards = gql('{dashboards{id name items{id title entryType statsSelection{interval rangeId}} ranges{id name}}}', admin_token)['data']['dashboards']
        assert len(dashboards) == 1 and dashboards[0]['id'] == 1 and dashboards[0]['items'][0]['entryType'] == 'BarChart'
        assert dashboards[0]['items'][0]['statsSelection'] == {'interval': 'Daily', 'rangeId': 1}
        assert gql('{userSettings{dateLocale theme firstDayOfTheWeek dateTimeInputStyle}}', admin_token)['data']['userSettings'] == {'dateLocale': 'German', 'theme': 'GruvboxDark', 'firstDayOfTheWeek': 'Monday', 'dateTimeInputStyle': 'Fancy'}
        assert business_rows(upgraded / 'traggo.db', original_columns) == expected_rows, 'business data changed during upgrade/read'
        with connect(upgraded / 'traggo.db') as db:
            verifier = db.execute('SELECT token FROM devices WHERE id=1').fetchone()[0]
        assert verifier.startswith('sha256:') and verifier != admin_token
        assert gql('{currentUser{id}}', verifier)['data']['currentUser'] is None
        favorites_url = favorites_base + '/favorites?user=legacy-admin'
        def favorites_request(payload=None):
            headers = {'Authorization': 'Bearer ' + favorites_token}
            data = None
            if payload is not None:
                headers['Content-Type'] = 'application/json'
                data = json.dumps(payload).encode()
            with urllib.request.urlopen(urllib.request.Request(favorites_url, data, headers, method='PUT' if payload is not None else 'GET'), timeout=5) as response:
                return json.load(response)
        favorites = favorites_request()
        assert favorites['favorites'][0]['titel'] == 'Preserved favorite'
        favorites['favorites'][0]['titel'] = 'Changed only in copy'
        assert favorites_request(favorites) == favorites
        new_password = secrets.token_urlsafe(24)
        gql('mutation($p:String!){updateUser(id:1,name:"legacy-admin",pass:$p,admin:true){id}}', admin_token, {'p': new_password})
        assert gql('{currentUser{id}}', admin_token)['data']['currentUser'] is None
        assert gql('{currentUser{id}}', other_token)['data']['currentUser']['id'] == 2
        assert gql('mutation($p:String!){login(username:"legacy-admin",pass:$p,deviceName:"upgrade-test",type:LongExpiry,cookie:false){token}}', variables={'p': new_password})['data']['login']['token']
        assert gql('mutation($p:String!){login(username:"legacy-admin",pass:$p,deviceName:"old-password",type:LongExpiry,cookie:false){token}}', variables={'p': password}, allow_errors=True).get('errors')
    finally:
        if process is not None:
            process.send_signal(signal.SIGTERM)
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()
        if container is not None:
            subprocess.run(['docker', 'rm', '-f', container], check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        log.close()
    with connect(upgraded / 'traggo.db') as db:
        assert db.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
        assert db.execute('PRAGMA foreign_key_check').fetchall() == []
    assert sha(original / 'traggo.db') == original_digest, 'source database was modified'
    assert (original / 'favorites.json').read_bytes() == original_favorites
    print('PASS: generated v0.8.3 data copy preserves entries, DST offsets, tags, timers, dashboards, settings, favorites and user isolation; token/password migration works; original backup unchanged; SQLite integrity valid')
