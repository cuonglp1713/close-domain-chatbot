exports.uploadFile = (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        res.json({
            filename: req.file.filename,
            path: req.file.path,
            message: 'File uploaded successfully'
        });
    } catch (error) {
        res.status(500).json({ error: 'Error uploading file' });
    }
};
