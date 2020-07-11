::James Oswald
start pythonServer.bat
timeout 1
start chrome.exe http://127.0.0.1:8000/game.html
pause
taskkill /f /t /fi "imagename eq cmd.exe"
