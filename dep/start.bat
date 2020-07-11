
set cdi=%cd%
C:
cd C:\Program Files\Google\Chrome\Application
"./chrome.exe" --disable-web-security --allow-file-access-from-files --allow-file-access %cdi%/game.html
pause