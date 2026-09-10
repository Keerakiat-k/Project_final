const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('src', function(filePath) {
    if (!filePath.endsWith('.jsx') && !filePath.endsWith('.js')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Replace template literals: `http://localhost:5000/api/...
    content = content.replace(/`http:\/\/localhost:5000/g, '`${import.meta.env.VITE_API_BASE_URL}');
    
    // Replace string literals: 'http://localhost:5000/api/...
    content = content.replace(/'http:\/\/localhost:5000/g, 'import.meta.env.VITE_API_BASE_URL + \'');
    
    // Replace double quote literals: "http://localhost:5000/api/...
    content = content.replace(/"http:\/\/localhost:5000/g, 'import.meta.env.VITE_API_BASE_URL + "');
    
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated: ' + filePath);
    }
});
