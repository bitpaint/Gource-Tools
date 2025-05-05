@echo off
setlocal enabledelayedexpansion

rem Trouver le fichier MP4 et MP3 dans le dossier courant
for %%v in (*.mp4) do set "video=%%v"
for %%a in (*.mp3) do set "audio=%%a"

if not defined video (
    echo Aucun fichier MP4 trouve.
    pause
    exit /b
)

if not defined audio (
    echo Aucun fichier MP3 trouve.
    pause
    exit /b
)

rem Extraire la duree de la video
for /f "tokens=*" %%d in ('ffprobe -v error -select_streams v:0 -show_entries stream^=duration -of default^=noprint_wrappers^=1:nokey^=1 "!video!"') do set "duration=%%d"

if not defined duration (
    echo Impossible d'extraire la duree de la video.
    pause
    exit /b
)

rem Prendre la partie entière de la durée (avant le .)
for /f "tokens=1 delims=." %%e in ("!duration!") do set "duration_int=%%e"

rem Calculer le point de début du fade-out (2 secondes avant la fin)
set /a fadeout_start=!duration_int!-2

if !fadeout_start! lss 0 set "fadeout_start=0"

echo Video : !video!
echo Audio : !audio!
echo Duree video : !duration! secondes
echo Fade-out commence a : !fadeout_start! secondes

rem Creer un nom de fichier de sortie
set "output=!video:.mp4=_with_music.mp4!"

rem Lancer la commande FFmpeg
ffmpeg -stream_loop -1 -i "!audio!" -i "!video!" -filter_complex "[0:a]atrim=duration=!duration!,afade=t=in:st=0:d=2,afade=t=out:st=!fadeout_start!:d=2[audio]" -map 1:v -map "[audio]" -c:v copy -c:a aac -shortest "!output!"

echo.
echo Fini ! Ton fichier final est : !output!
pause
