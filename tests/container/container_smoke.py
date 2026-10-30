"""Test only a disposable candidate container with generated credentials and tmpfs data."""
import json
import os
import re
import secrets
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request

image = sys.argv[1]
name = 'zeitfokus-test-' + secrets.token_hex(6)
password = secrets.token_urlsafe(24)
favorites_token = secrets.token_urlsafe(32)

def docker(*args):
    return subprocess.check_output(['docker', *args], text=True).strip()

with tempfile.TemporaryDirectory(prefix='zeitfokus-container-test-') as directory:
    envfile = os.path.join(directory, 'test.env')
    with open(envfile, 'w') as out:
        out.write(
            'ZEITFOKUS_DEFAULT_USER_PASS=' + password +
            '\nZEITFOKUS_FAVORITES_TOKEN=' + favorites_token +
            '\nZEITFOKUS_DATABASE_CONNECTION=/tmp/zeitfokus.db' +
            '\nZEITFOKUS_FAVORITES_STORE=/tmp/favorites.json\n'
        )
    os.chmod(envfile, 0o600)
    try:
        docker('run', '-d', '--name', name, '--read-only', '--tmpfs', '/tmp', '--tmpfs', '/opt/zeitfokus/data', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges:true', '--env-file', envfile, '-p', '127.0.0.1::3030', '-p', '127.0.0.1::3031', image)
        try:
            base = 'http://' + docker('port', name, '3030/tcp')
            favorites = 'http://' + docker('port', name, '3031/tcp') + '/favorites?user=admin'
        except subprocess.CalledProcessError:
            print(docker('logs', name), file=sys.stderr)
            raise
        for attempt in range(150):
            try:
                with urllib.request.urlopen(base, timeout=2) as response:
                    html = response.read().decode()
                break
            except OSError:
                time.sleep(.2)
        else:
            raise RuntimeError('candidate did not start')
        script = re.search(r'<script[^>]+src="([^"]+)"', html)
        assert script, 'missing frontend entrypoint'
        with urllib.request.urlopen(urllib.parse.urljoin(base + '/', script.group(1)), timeout=10) as response:
            assert response.status == 200 and len(response.read()) > 1000
        def gql(query, variables=None, token=None):
            headers = {'Content-Type': 'application/json'}
            if token:
                headers['Authorization'] = 'traggo ' + token
            request = urllib.request.Request(base + '/graphql', json.dumps({'query': query, 'variables': variables or {}}).encode(), headers)
            with urllib.request.urlopen(request, timeout=10) as response:
                result = json.load(response)
                assert not result.get('errors'), 'GraphQL operation failed'
                return result['data'], response.headers
        data, headers = gql('mutation($p:String!){login(username:"admin",pass:$p,deviceName:"container-test",type:LongExpiry,cookie:true){token}}', {'p': password})
        token = data['login']['token']
        data, _ = gql('mutation{setInterfaceLanguage(language:German){interfaceLanguage}}', token=token)
        assert data['setInterfaceLanguage']['interfaceLanguage'] == 'German'
        data, _ = gql('{userSettings{interfaceLanguage}}', token=token)
        assert data['userSettings']['interfaceLanguage'] == 'German'
        cookie = headers.get('Set-Cookie', '')
        assert 'HttpOnly' in cookie and 'SameSite=Lax' in cookie
        data, _ = gql('{currentUser{name}}', token=token)
        assert data['currentUser']['name'] == 'admin'
        data, _ = gql('mutation{createTimeSpan(start:"2026-10-29T10:00:00+01:00",note:"synthetic timer"){id}}', token=token)
        entry = data['createTimeSpan']['id']
        gql('mutation($id:Int!){stopTimeSpan(id:$id,end:"2026-10-29T11:00:00+01:00"){id end}}', {'id': entry}, token)
        payload = {'updatedAt': 1, 'favorites': [{'id': 'synthetic', 'titel': 'Container test', 'position': 0}]}
        request = urllib.request.Request(favorites, json.dumps(payload).encode(), {'Authorization': 'Bearer ' + favorites_token, 'Content-Type': 'application/json'}, method='PUT')
        with urllib.request.urlopen(request, timeout=5) as response:
            assert json.load(response) == payload
        with urllib.request.urlopen(urllib.request.Request(favorites, headers={'Authorization': 'Bearer ' + favorites_token}), timeout=5) as response:
            assert json.load(response) == payload
        try:
            urllib.request.urlopen(favorites, timeout=5)
        except urllib.error.HTTPError as error:
            assert error.code == 401
        else:
            raise AssertionError('unauthenticated favorites access')
        print('PASS: container, frontend assets, login/cookie, native timer API and protected favorites')
    finally:
        subprocess.run(['docker', 'rm', '-f', name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
