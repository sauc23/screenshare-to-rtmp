const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { spawn } = require('child_process');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static(__dirname));

io.on('connection', (socket) => {
    console.log('Client connected');

    let ffmpeg;

    socket.on('stream', (data) => {
        if (!ffmpeg) {
            ffmpeg = spawn('ffmpeg', [
                '-re',
                '-i', '-',
                '-c:v', 'libx264',
                '-preset', 'ultrafast',
                '-vf', 'scale=1280:720',
                '-c:a', 'aac',
                '-f', 'flv',
                'rtmp://64.176.217.185:1935/live/test'
            ]);

            ffmpeg.stdin.on('error', (e) => {
                console.log('FFmpeg stdin error:', e);
            });

            ffmpeg.stderr.on('data', (data) => {
                console.log('FFmpeg stderr:', data.toString());
            });

            ffmpeg.on('close', (code) => {
                console.log('FFmpeg process closed with code', code);
            });
        }

        ffmpeg.stdin.write(data);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
        if (ffmpeg) {
            ffmpeg.stdin.end();
            ffmpeg.kill('SIGINT');
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
