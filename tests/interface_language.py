"""End-to-end language preferences against an isolated, disposable database."""
import argparse
import json
import os
from pathlib import Path
import signal
import socket
import subprocess
import tempfile
import time
import urllib.error
import urllib.request

parser = argparse.ArgumentParser()
parser.add_argument('--binary', required=True)
args = parser.parse_args()
with tempfile.TemporaryDirectory(prefix='traggo-language-') as directory:
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        port = sock.getsockname()[1]
    env = {**os.environ, 'TRAGGO_PORT': str(port), 'TRAGGO_DATABASE_CONNECTION': str(Path(directory) / 'traggo.db'), 'TRAGGO_DEFAULT_USER_NAME': 'admin', 'TRAGGO_DEFAULT_USER_PASS': 'Synthetic-Test-2026!'}
    with open(Path(directory) / 'server.log', 'w') as log:
        proc = subprocess.Popen([str(Path(args.binary).resolve())], cwd=directory, env=env, stdout=log, stderr=log)
        try:
            def gql(query, token=None, allow_errors=False):
                headers = {'Content-Type': 'application/json'}
                if token:
                    headers['Authorization'] = 'traggo ' + token
                request = urllib.request.Request(f'http://127.0.0.1:{port}/graphql', json.dumps({'query': query}).encode(), headers)
                try:
                    with urllib.request.urlopen(request, timeout=5) as response:
                        result = json.load(response)
                except urllib.error.HTTPError as error:
                    if not allow_errors:
                        raise
                    result = json.load(error)
                if not allow_errors:
                    assert not result.get('errors'), result
                return result
            for attempt in range(100):
                try:
                    gql('{version{name}}')
                    break
                except OSError:
                    time.sleep(.1)
            else:
                raise RuntimeError('server did not start')
            assert gql('mutation{setInterfaceLanguage(language:German){interfaceLanguage}}', allow_errors=True).get('errors')
            login = 'mutation{login(username:"admin",pass:"Synthetic-Test-2026!",deviceName:"api test",type:LongExpiry,cookie:false){token}}'
            token = gql(login)['data']['login']['token']
            assert gql('{userSettings{interfaceLanguage}}', token)['data']['userSettings']['interfaceLanguage'] is None
            assert gql('mutation{setInterfaceLanguage(language:German){interfaceLanguage}}', token)['data']['setInterfaceLanguage']['interfaceLanguage'] == 'German'
            assert gql('mutation{setInterfaceLanguage(language:French){interfaceLanguage}}', token, True).get('errors')
            gql('mutation{createTimeSpan(start:"2026-10-29T10:00:00+01:00",end:"2026-10-29T11:00:00+01:00",tags:[],note:"language fixture"){id}}', token)
            before = gql('{timeSpans{timeSpans{id start end note}}}', token)
            gql('mutation{setUserSettings(settings:{theme:MaterialLight,dateLocale:British,firstDayOfTheWeek:Sunday,dateTimeInputStyle:Native}){theme}}', token)
            assert gql('{userSettings{interfaceLanguage}}', token)['data']['userSettings']['interfaceLanguage'] == 'German'
            gql('mutation{setInterfaceLanguage(language:English){interfaceLanguage}}', token)
            assert gql('{timeSpans{timeSpans{id start end note}}}', token) == before
            new_token = gql(login)['data']['login']['token']
            settings = gql('{userSettings{interfaceLanguage theme dateLocale firstDayOfTheWeek}}', new_token)['data']['userSettings']
            assert settings == {'interfaceLanguage': 'English', 'theme': 'MaterialLight', 'dateLocale': 'British', 'firstDayOfTheWeek': 'Sunday'}, settings
            print('PASS: authorization, enum validation, browser-default unset, per-user language persistence, legacy settings compatibility, relogin and unchanged time entries')
        finally:
            proc.send_signal(signal.SIGTERM)
            try:
                proc.wait(timeout=10)
            except subprocess.TimeoutExpired:
                proc.kill()
                proc.wait()
