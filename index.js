var fs = require("fs"),
    http = require("http"),
    url = require("url"),
    path = require("path");

var cp = require('child_process');
var ls = cp.exec(`"c:\\program files (x86)\\Google\\Chrome\\Application\\chrome.exe" --no-sandbox --start-fullscreen https://translate.alibaba.com/audio/setting.htm?v=http://localhost:8888/movie.mp4`, {}/*options, [optional]*/);

ls.stdout.on('data', function (data) {
    console.log('stdout: ' + data);
});

ls.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
});

ls.on('exit', function (code) {
    console.log('child process exited with code ' + code);
});

http.createServer(function (req, res) {
    if (req.url != "/movie.mp4") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end('<video src="http://localhost:8888/movie.mp4" controls></video>');
    } else {
        var file = path.resolve(__dirname, "movie.mp4");
        fs.stat(file, function (err, stats) {
            if (err) {
                if (err.code === 'ENOENT') {
                    // 404 Error if file not found
                    return res.sendStatus(404);
                }
                res.end(err);
            }
            var range = req.headers.range;
            if (!range) {
                // 416 Wrong range
                return res.sendStatus(416);
            }
            var positions = range.replace(/bytes=/, "").split("-");
            var start = parseInt(positions[0], 10);
            var total = stats.size;
            var end = positions[1] ? parseInt(positions[1], 10) : total - 1;
            var chunksize = (end - start) + 1;

            res.writeHead(206, {
                "Content-Range": "bytes " + start + "-" + end + "/" + total,
                "Accept-Ranges": "bytes",
                "Content-Length": chunksize,
                "Content-Type": "video/mp4"
            });

            var stream = fs.createReadStream(file, { start: start, end: end })
                .on("open", function () {
                    stream.pipe(res);
                }).on("error", function (err) {
                    res.end(err);
                });
        });
    }
}).listen(8888);

