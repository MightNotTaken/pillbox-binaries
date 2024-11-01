const net = require('net');
const fs = require('fs');
const path = require('path');

const intMaxValue = 4294967295;
const filename = "C:\\Users\\Tahir\\AppData\\Local\\Temp\\arduino\\sketches\\56E72E47308BAABB32C268F6AC23F42C\\km0_km4_image2.bin";
const host = "192.168.42.45";
// const host = "pillbox_adapter.local";
const port = 8082;

function calculateChecksum(filePath) {
    return new Promise((resolve, reject) => {
        let checksum = 0;
        const stream = fs.createReadStream(filePath);

        stream.on('data', (chunk) => {
            for (let i = 0; i < chunk.length; i++) {
                checksum = (checksum + chunk[i]) % intMaxValue;
            }
        });

        stream.on('end', () => {
            resolve(checksum);
        });

        stream.on('error', (err) => {
            reject(err);
        });
    });
}

async function sendFile() {
    try {
        const length = fs.statSync(filename).size;
        const checksum = await calculateChecksum(filename);
        const empty = 0;

        console.log("Checksum:", checksum.toString(16));
        console.log("Length:", length);

        // Prepare header
        const headerBuffer = Buffer.alloc(12);
        headerBuffer.writeUInt32LE(checksum, 0);
        headerBuffer.writeUInt32LE(empty, 4);
        headerBuffer.writeUInt32LE(length, 8);

        // Connect and send
        const client = new net.Socket();
        client.connect(port, host, () => {
            console.log('Connected to server');
            client.write(headerBuffer);

            const fileStream = fs.createReadStream(filename);
            fileStream.pipe(client, { end: false });

            fileStream.on('end', () => {
                console.log("File sent successfully");
                client.end();
            });
        });

        client.on('close', () => {
            console.log('Connection closed');
        });

        client.on('error', (err) => {
            console.error("Socket error:", err);
        });

    } catch (err) {
        console.error("Error:", err);
    }
}

sendFile();
