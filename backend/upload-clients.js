// Usage: node upload-clients.js
// Make sure you have run: npm install aws-sdk

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

const BUCKET = 'rnbevents716';
const REGION = 'us-east-2';
const FILE = path.join(__dirname, 'RNB EVENTS/Client/clients.json');

// TODO: Replace with your actual credentials
AWS.config.update({
  accessKeyId: 'YOUR_ACCESS_KEY_ID',
  secretAccessKey: 'YOUR_SECRET_ACCESS_KEY',
  region: REGION
});

const s3 = new AWS.S3();

fs.readFile(FILE, (err, data) => {
  if (err) throw err;
  s3.putObject({
    Bucket: BUCKET,
    Key: 'clients.json',
    Body: data,
    ContentType: 'application/json',
    ACL: 'public-read'
  }, (err, res) => {
    if (err) throw err;
    console.log('Upload successful:', res);
  });
});
