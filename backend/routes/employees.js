// ดึงการเชื่อมต่อ Database เข้ามา (เปลี่ยนพาธตามที่คุณใช้งานจริง)
const pool = require('../config/db'); 

// ฟังก์ชันสำหรับบันทึกพนักงานใหม่ (POST /api/employees)
exports.createEmployee = async (req, res) => {
  const data = req.body;
  
  // สร้าง Connection พิเศษสำหรับการทำ Transaction
  const connection = await pool.getConnection();

  try {
    // เริ่มต้น Transaction (หากพังตรงไหน จะถูกยกเลิกทั้งหมด)
    await connection.beginTransaction();

    // ==========================================
    // 1. บันทึกลงตารางหลัก (employees)
    // ==========================================
    const [empResult] = await connection.execute(
      `INSERT INTO employees (
        company_prefix, employee_code, email, position, department_id, role_id,
        title_th, first_name_th, last_name_th, title_en, first_name_en, last_name_en, nickname,
        date_of_birth, national_id, height, weight, blood_group, religion, marital_status, military_status,
        mobile, home_phone, personal_email, home_address, current_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.companyPrefix, data.employeeCode, data.email || null, data.position, data.departmentId, data.roleId,
        data.titleThai, data.firstName, data.lastName, data.titleEnglish || null, data.englishFirstName || null, data.englishLastName || null, data.nickname || null,
        data.dateOfBirth, data.nationalId, data.height || null, data.weight || null, data.bloodGroup || null, data.religion || null, data.maritalStatus || null, data.militaryStatus || null,
        data.mobile, data.homePhone || null, data.personalEmail || null, data.homeAddress || null, data.currentAddress || null
      ]
    );

    // ดึง ID ของพนักงานที่เพิ่งถูกสร้างขึ้นมา เพื่อใช้เป็น Foreign Key
    const employeeId = empResult.insertId;

    // ==========================================
    // 2. บันทึกลงตารางครอบครัว (employee_families)
    // ==========================================
    await connection.execute(
      `INSERT INTO employee_families (
        employee_id, parent_status, father_name, father_age, father_occupation,
        mother_name, mother_age, mother_occupation, total_siblings, male_siblings, female_siblings, sibling_rank,
        spouse_name, spouse_workplace, total_children, studying_children,
        emergency_name, emergency_relation, emergency_phone, emergency_workplace
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        employeeId, data.parentStatus || null, data.fatherName || null, data.fatherAge || null, data.fatherOccupation || null,
        data.motherName || null, data.motherAge || null, data.motherOccupation || null, data.totalSiblings || 0, data.maleSiblings || 0, data.femaleSiblings || 0, data.siblingRank || null,
        data.spouseName || null, data.spouseWorkplace || null, data.totalChildren || 0, data.studyingChildren || 0,
        data.emergencyName, data.emergencyRelation, data.emergencyPhone, data.emergencyWorkplace || null
      ]
    );

    // ==========================================
    // 3. บันทึกลงตารางข้อมูลอื่นๆ (employee_additional_info)
    // ==========================================
    await connection.execute(
      `INSERT INTO employee_additional_info (
        employee_id, thai_speak, thai_write, thai_read, eng_speak, eng_write, eng_read,
        other_lang_name, other_speak, other_write, other_read, typing_thai, typing_eng, computer_skill, office_machine,
        drive_car, car_license, car_reg, drive_moto, moto_license, moto_reg, hobbies, sports,
        severe_illness, illness_detail, expected_salary, house_type, relocation_plan, relocation_detail, self_introduction,
        ref1_name, ref1_occupation, ref1_relation, ref1_address, ref1_phone,
        ref2_name, ref2_occupation, ref2_relation, ref2_address, ref2_phone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        employeeId, data.thaiSpeak || null, data.thaiWrite || null, data.thaiRead || null, data.engSpeak || null, data.engWrite || null, data.engRead || null,
        data.otherLangName || null, data.otherSpeak || null, data.otherWrite || null, data.otherRead || null, data.typingThai || null, data.typingEng || null, data.computerSkill || null, data.officeMachine || null,
        data.driveCar || 'ไม่ได้', data.carLicense || null, data.carReg || null, data.driveMoto || 'ไม่ได้', data.motoLicense || null, data.motoReg || null, data.hobbies || null, data.sports || null,
        data.severeIllness || 'ไม่เคย', data.illnessDetail || null, data.expectedSalary || null, data.houseType || null, data.relocationPlan || null, data.relocationDetail || null, data.selfIntroduction || null,
        data.ref1Name || null, data.ref1Occupation || null, data.ref1Relation || null, data.ref1Address || null, data.ref1Phone || null,
        data.ref2Name || null, data.ref2Occupation || null, data.ref2Relation || null, data.ref2Address || null, data.ref2Phone || null
      ]
    );

    // ==========================================
    // 4. บันทึกประวัติการศึกษา (Array)
    // ==========================================
    if (data.educations && data.educations.length > 0) {
      for (const edu of data.educations) {
        if (edu.level && edu.institution) { // เช็คว่าไม่ได้เป็นค่าว่าง
          await connection.execute(
            `INSERT INTO employee_educations (employee_id, level, institution, major, start_date, end_date, gpa)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [employeeId, edu.level, edu.institution, edu.major || null, edu.startDate || null, edu.endDate || null, edu.gpa || null]
          );
        }
      }
    }

    // ==========================================
    // 5. บันทึกประวัติการทำงาน (Array)
    // ==========================================
    if (data.experiences && data.experiences.length > 0) {
      for (const exp of data.experiences) {
        if (exp.company) {
          await connection.execute(
            `INSERT INTO employee_experiences (employee_id, company, business_type, start_position, end_position, start_salary, end_salary, start_date, end_date, description, reason_to_leave)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [employeeId, exp.company, exp.businessType || null, exp.startPosition || null, exp.endPosition || null, exp.startSalary || null, exp.endSalary || null, exp.startDate || null, exp.endDate || null, exp.description || null, exp.reasonToLeave || null]
          );
        }
      }
    }

    // ==========================================
    // 6. บันทึกประวัติการฝึกอบรม (Array)
    // ==========================================
    if (data.trainings && data.trainings.length > 0) {
      for (const trn of data.trainings) {
        if (trn.course) {
          await connection.execute(
            `INSERT INTO employee_trainings (employee_id, course, institution, duration)
             VALUES (?, ?, ?, ?)`,
            [employeeId, trn.course, trn.institution || null, trn.duration || null]
          );
        }
      }
    }

    // หากทุกคำสั่งผ่านฉลุย ให้สั่ง COMMIT ยืนยันการบันทึก
    await connection.commit();
    
    res.status(201).json({ 
      status: 'success', 
      message: 'บันทึกข้อมูลพนักงานสำเร็จ',
      employeeId: employeeId 
    });

  } catch (error) {
    // หากมี Error ตรงไหนก็ตาม ให้ย้อนกลับ (ROLLBACK) สิ่งที่เพิ่งบันทึกไปทั้งหมด
    await connection.rollback();
    console.error('Database Error:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
  } finally {
    // คืน Connection กลับสู่ Pool เสมอ
    connection.release();
  }
};