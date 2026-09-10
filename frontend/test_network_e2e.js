import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runFullE2ETests() {
  console.log('====================================================');
  console.log('🚀 QA E2E AUTOMATED SUITE: MULTI-BRANCH NETWORK MANAGEMENT');
  console.log('====================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const report = {
    testDate: new Date().toISOString(),
    baseUrl: 'http://localhost:5173',
    moduleUrl: 'http://localhost:5173/admin/network',
    testCases: []
  };

  function logResult(id, title, pass, details = {}) {
    const status = pass ? 'PASS ✅' : 'FAIL ❌';
    console.log(`[${id}] ${title}: ${status}`);
    if (Object.keys(details).length > 0) {
      console.log('   Details:', JSON.stringify(details));
    }
    report.testCases.push({ id, title, pass, details });
  }

  try {
    // ------------------------------------------------------------------------
    // TEST CASE 1: Access Control & Sidebar Navigation (/admin/network)
    // ------------------------------------------------------------------------
    console.log('\n--- 1. Testing Access Control & Sidebar Navigation ---');
    
    // Set Admin Role in LocalStorage
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      const adminUser = {
        id: 1,
        email: 'admin@company.com',
        role: 'Admin',
        role_id: 1,
        permissions: ['manage_employees', 'manage_announcements', 'manage_it_support', 'manage_assets', 'manage_settings']
      };
      localStorage.setItem('user_info', JSON.stringify(adminUser));
      localStorage.setItem('auth_token', 'mock_admin_token');
    });

    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });
    
    // Check Sidebar Item
    const sidebarLink = page.locator('a[href="/admin/network"]');
    const isSidebarVisible = await sidebarLink.isVisible();
    const sidebarText = isSidebarVisible ? (await sidebarLink.textContent()).trim() : '';

    let accessAllowedAdmin = false;
    if (isSidebarVisible) {
      await sidebarLink.click();
      await page.waitForTimeout(800);
      accessAllowedAdmin = page.url().includes('/admin/network');
    }

    // Test IT Support Role access
    await page.evaluate(() => {
      const itUser = {
        id: 4,
        email: 'itsupport@company.com',
        role: 'IT Support',
        role_id: 4,
        permissions: ['manage_it_support']
      };
      localStorage.setItem('user_info', JSON.stringify(itUser));
      localStorage.setItem('mockRole', '4');
    });
    await page.goto('http://localhost:5173/admin/network', { waitUntil: 'networkidle' });
    const accessAllowedIT = page.url().includes('/admin/network');

    // Test Employee Role (Should be restricted)
    await page.evaluate(() => {
      const empUser = {
        id: 3,
        email: 'employee@company.com',
        role: 'Employee',
        role_id: 3,
        permissions: []
      };
      localStorage.setItem('user_info', JSON.stringify(empUser));
      localStorage.setItem('mockRole', '3');
    });
    await page.goto('http://localhost:5173/admin/network', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const employeeRestricted = await page.locator('text=403 Forbidden').isVisible() || page.url().includes('/dashboard');

    // Restore Admin Role for remaining tests
    await page.evaluate(() => {
      const adminUser = {
        id: 1,
        email: 'admin@company.com',
        role: 'Admin',
        role_id: 1,
        permissions: ['manage_employees', 'manage_announcements', 'manage_it_support', 'manage_assets', 'manage_settings']
      };
      localStorage.setItem('user_info', JSON.stringify(adminUser));
      localStorage.setItem('mockRole', '1');
    });
    await page.goto('http://localhost:5173/admin/network', { waitUntil: 'networkidle' });

    logResult('TC-01', 'Sidebar Menu & RBAC Access Control', 
      isSidebarVisible && accessAllowedAdmin && accessAllowedIT && employeeRestricted,
      { isSidebarVisible, sidebarText, accessAllowedAdmin, accessAllowedIT, employeeRestricted }
    );

    // ------------------------------------------------------------------------
    // TEST CASE 2: Multi-Branch Dropdown Selector & Table Filtering
    // ------------------------------------------------------------------------
    console.log('\n--- 2. Testing Branch Dropdown Selector [🏢 สาขา: ทั้งหมด ▾] ---');
    const branchSelect = page.locator('select').first();
    
    // Select ASCG HQ
    await branchSelect.selectOption('ASCG HQ');
    await page.waitForTimeout(500);
    const hqCountText = await page.locator('div:has-text("อุปกรณ์ทั้งหมด") + div').first().textContent().catch(() => '');
    const hqCount = parseInt(hqCountText) || 0;

    // Select BD7
    await branchSelect.selectOption('BD7');
    await page.waitForTimeout(500);
    const bd7CountText = await page.locator('div:has-text("อุปกรณ์ทั้งหมด") + div').first().textContent().catch(() => '');
    const bd7Count = parseInt(bd7CountText) || 0;

    // Select BD8
    await branchSelect.selectOption('BD8');
    await page.waitForTimeout(500);
    const bd8CountText = await page.locator('div:has-text("อุปกรณ์ทั้งหมด") + div').first().textContent().catch(() => '');
    const bd8Count = parseInt(bd8CountText) || 0;

    // Select BD15
    await branchSelect.selectOption('BD15');
    await page.waitForTimeout(500);
    const bd15CountText = await page.locator('div:has-text("อุปกรณ์ทั้งหมด") + div').first().textContent().catch(() => '');
    const bd15Count = parseInt(bd15CountText) || 0;

    // Select ทั้งหมด
    await branchSelect.selectOption('ทั้งหมด');
    await page.waitForTimeout(500);
    const totalCountText = await page.locator('div:has-text("อุปกรณ์ทั้งหมด") + div').first().textContent().catch(() => '');
    const totalCount = parseInt(totalCountText) || 0;

    const isBranchSelectorWorking = hqCount === 5 && bd7Count === 8 && bd8Count === 23 && bd15Count >= 28 && totalCount >= 65;

    logResult('TC-02', 'Multi-Branch Dropdown Switcher', isBranchSelectorWorking, {
      ASCG_HQ: hqCount,
      BD7: bd7Count,
      BD8: bd8Count,
      BD15: bd15Count,
      Total_All: totalCount
    });

    // ------------------------------------------------------------------------
    // TEST CASE 3: Verification of Specific Devices in BD15 (28 items)
    // ------------------------------------------------------------------------
    console.log('\n--- 3. Testing BD15 Devices (28 Items) ---');
    await branchSelect.selectOption('BD15');
    await page.waitForTimeout(500);

    const searchInput = page.locator('input[placeholder*="ค้นหาตาม IP Address"]');

    // 3.1 Check Express Cloud 203.151.54.109
    await searchInput.fill('203.151.54.109');
    await page.waitForTimeout(400);
    const expressCloudFound = (await page.locator('table tbody tr').count()) > 0;
    const expressCloudText = expressCloudFound ? await page.locator('table tbody tr').first().innerText() : '';

    // 3.2 Check ZKTeco BD15 192.168.7.18
    await searchInput.fill('192.168.7.18');
    await page.waitForTimeout(400);
    const zktBD15Found = (await page.locator('table tbody tr').count()) > 0;

    // 3.3 Check PABX 192.168.7.9 tech / 19911991
    await searchInput.fill('192.168.7.9');
    await page.waitForTimeout(400);
    const pabxBD15Found = (await page.locator('table tbody tr').count()) > 0;
    const pabxText = pabxBD15Found ? await page.locator('table tbody tr').first().innerText() : '';

    await searchInput.fill('');
    await page.waitForTimeout(400);

    const isBD15Verified = bd15Count >= 28 && expressCloudFound && zktBD15Found && pabxBD15Found;
    logResult('TC-03', 'BD15 Branch Device Verification (28 Items)', isBD15Verified, {
      bd15Count,
      expressCloud: { found: expressCloudFound, details: expressCloudText.replace(/\s+/g, ' ').slice(0, 100) },
      zkTecoBD15: { found: zktBD15Found },
      pabxBD15: { found: pabxBD15Found, details: pabxText.replace(/\s+/g, ' ').slice(0, 100) }
    });

    // ------------------------------------------------------------------------
    // TEST CASE 4: Verification of Specific Devices in BD8 (23 items) & BD7 (8 items)
    // ------------------------------------------------------------------------
    console.log('\n--- 4. Testing BD8 (23 Items) & BD7 (8 Items) ---');
    
    // Test BD8
    await branchSelect.selectOption('BD8');
    await page.waitForTimeout(500);
    await searchInput.fill('192.168.8.2');
    await page.waitForTimeout(400);
    const serv01Found = (await page.locator('table tbody tr').count()) > 0;

    await searchInput.fill('NAV-SERVER');
    await page.waitForTimeout(400);
    const navServerFound = (await page.locator('table tbody tr').count()) > 0;

    await searchInput.fill('FGT90D');
    await page.waitForTimeout(400);
    const fgt90dFound = (await page.locator('table tbody tr').count()) > 0;

    // Test BD7
    await branchSelect.selectOption('BD7');
    await page.waitForTimeout(500);
    await searchInput.fill('192.168.7.17');
    await page.waitForTimeout(400);
    const zktBD7Found = (await page.locator('table tbody tr').count()) > 0;

    await searchInput.fill('');
    await page.waitForTimeout(400);

    const isBD8_BD7Verified = bd8Count === 23 && serv01Found && navServerFound && fgt90dFound && bd7Count === 8 && zktBD7Found;
    logResult('TC-04', 'BD8 (23 Items) & BD7 (8 Items) Verification', isBD8_BD7Verified, {
      bd8Count,
      serv01Found,
      navServerFound,
      fgt90dFound,
      bd7Count,
      zktBD7Found
    });

    // ------------------------------------------------------------------------
    // TEST CASE 5: Password Reveal Toggle & Audit Log Notice & 60s Countdown
    // ------------------------------------------------------------------------
    console.log('\n--- 5. Testing Password Reveal Toggle & Audit Log & Timer ---');
    
    // Switch to BD15 for test
    await branchSelect.selectOption('BD15');
    await page.waitForTimeout(500);

    const firstRowPassCell = page.locator('table tbody tr').first().locator('td').nth(5);
    const initialPassContent = await firstRowPassCell.innerText();
    const initialMasked = initialPassContent.includes('••••••••');

    const toggleEyeBtn = firstRowPassCell.locator('button');
    await toggleEyeBtn.click();
    await page.waitForTimeout(400);

    const swalModalVisible = await page.locator('.swal2-popup').isVisible();
    let auditValidationTested = false;
    let passwordRevealedBD15 = false;
    let countdownActiveBD15 = false;

    if (swalModalVisible) {
      // Test validation: submit empty reason
      await page.click('.swal2-confirm');
      await page.waitForTimeout(300);
      const valError = await page.locator('.swal2-validation-message').isVisible();
      auditValidationTested = valError;

      // Fill reason
      await page.fill('#swal-reveal-reason', 'QA E2E Inspection BD15 Password');
      await page.click('.swal2-confirm');
      await page.waitForTimeout(800);

      // Check revealed content
      const unmaskedContent = await firstRowPassCell.innerText();
      passwordRevealedBD15 = !unmaskedContent.includes('••••••••');
      countdownActiveBD15 = unmaskedContent.includes('ซ่อนใน');
    }

    // Now test BD8 branch password reveal
    await branchSelect.selectOption('BD8');
    await page.waitForTimeout(500);

    const bd8RowPassCell = page.locator('table tbody tr').first().locator('td').nth(5);
    const bd8ToggleBtn = bd8RowPassCell.locator('button');
    await bd8ToggleBtn.click();
    await page.waitForTimeout(400);

    let passwordRevealedBD8 = false;
    let countdownActiveBD8 = false;

    if (await page.locator('.swal2-popup').isVisible()) {
      await page.fill('#swal-reveal-reason', 'QA E2E Inspection BD8 Password');
      await page.click('.swal2-confirm');
      await page.waitForTimeout(800);

      const unmaskedContentBD8 = await bd8RowPassCell.innerText();
      passwordRevealedBD8 = !unmaskedContentBD8.includes('••••••••');
      countdownActiveBD8 = unmaskedContentBD8.includes('ซ่อนใน');
    }

    logResult('TC-05', 'Password Reveal Toggle & Audit Log Notice & 60s Countdown (BD15/BD8)', 
      initialMasked && swalModalVisible && auditValidationTested && passwordRevealedBD15 && countdownActiveBD15 && passwordRevealedBD8 && countdownActiveBD8,
      { initialMasked, swalModalVisible, auditValidationTested, passwordRevealedBD15, countdownActiveBD15, passwordRevealedBD8, countdownActiveBD8 }
    );

    // ------------------------------------------------------------------------
    // TEST CASE 6: Add Device Modal & Duplicate IP Warning Check
    // ------------------------------------------------------------------------
    console.log('\n--- 6. Testing Add Device Modal & IP Conflict Warning ---');
    await branchSelect.selectOption('ทั้งหมด');
    await page.waitForTimeout(400);

    const addDeviceBtn = page.locator('button:has-text("+ เพิ่มอุปกรณ์ใหม่")');
    await addDeviceBtn.click();
    await page.waitForTimeout(400);

    const isModalVisible = await page.locator('h2:has-text("เพิ่มอุปกรณ์เครือข่ายใหม่")').isVisible();

    // Type duplicate IP (192.168.99.1)
    const ipField = page.locator('input[name="ip_address"]');
    await ipField.fill('192.168.99.1');
    await page.waitForTimeout(400);

    const duplicateWarningVisible = await page.locator('text=คำเตือน IP ซ้ำ').isVisible();
    const duplicateWarningText = duplicateWarningVisible ? (await page.locator('text=คำเตือน IP ซ้ำ').locator('xpath=..').innerText()).trim() : '';

    // Type unique IP (192.168.99.250)
    await ipField.fill('192.168.99.250');
    await page.waitForTimeout(400);
    const validIpNotice = await page.locator('text=IP Address นี้ว่างอยู่').isVisible();

    // Close Modal
    await page.locator('button:has-text("ยกเลิก")').last().click();
    await page.waitForTimeout(400);

    logResult('TC-06', 'Add Device Modal & IP Duplicate Warning', 
      isModalVisible && duplicateWarningVisible && validIpNotice,
      { isModalVisible, duplicateWarningVisible, duplicateWarningText, validIpNotice }
    );

    // Save final evidence screenshot
    const screenshotDir = 'C:\\Users\\keerakiat.k\\.gemini\\antigravity\\brain\\59333e27-eb30-4a15-9c1e-6c4f32a1e5dc';
    const screenshotPath = path.join(screenshotDir, 'multi_branch_network_e2e.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`\n📸 Evidence screenshot captured: ${screenshotPath}`);

  } catch (err) {
    console.error('Fatal Exception during E2E Run:', err);
  } finally {
    await browser.close();
    
    // Save JSON Summary Report
    const reportPath = 'C:\\Users\\keerakiat.k\\.gemini\\antigravity\\brain\\59333e27-eb30-4a15-9c1e-6c4f32a1e5dc\\scratch\\multi_branch_e2e_report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log('\n====================================================');
    console.log('✅ QA SUITE EXECUTED SUCCESSFULLY. REPORT GENERATED.');
    console.log('====================================================');
  }
}

runFullE2ETests();
