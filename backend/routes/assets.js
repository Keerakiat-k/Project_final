const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const assetUpload = require('../middleware/assetUpload');

// 1. ดึงข้อมูล
router.get('/', assetController.getAllAssets);
router.get('/filter-options', assetController.getFilterOptions);
router.get('/suggest-code', assetController.suggestAssetCode);
router.get('/:id', assetController.getAssetById);

// 2. จัดการข้อมูลหลัก (CRUD) & อัปโหลดรูปภาพ
router.post('/upload-image', assetUpload.single('image'), assetController.uploadAssetImage);
router.post('/', assetController.createAsset);
router.put('/:id', assetController.updateAsset);
router.delete('/:id', assetController.deleteAsset);

// 3. เวิร์กโฟลว์ ยืม - โอนย้าย - คืนคลัง - ซ่อมบำรุง
router.post('/:id/transfer', assetController.transferAsset);
router.post('/:id/return', assetController.returnAsset);
router.post('/:id/maintenance', assetController.addMaintenanceLog);

module.exports = router;
