const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Database connection (reuse the same pool configuration)
const pool = new Pool({
    user: process.env.DB_USER || 'elyte_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'elyte_platform',
    password: process.env.DB_PASSWORD || 'elyte_password',
    port: process.env.DB_PORT || 5432,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

class Admin {
    static async create(adminData) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            const {
                firstName,
                lastName,
                email,
                phone,
                employeeId,
                role,
                department,
                areaOfResponsibility,
                securityClearance,
                workLocation,
                reportingManager,
                startDate,
                passwordHash,
                twoFactorAuth,
                securityQuestions,
                emergencyContact,
                accessPermissions,
                documents,
                status,
                verificationCode,
                createdAt
            } = adminData;

            // Insert into admins table
            const adminQuery = `
                INSERT INTO admins (
                    first_name, last_name, email, phone, employee_id,
                    role, department, area_of_responsibility, security_clearance, work_location,
                    start_date, password_hash, status, verification_code, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                RETURNING id
            `;

            const adminValues = [
                firstName, lastName, email, phone, employeeId,
                role, department, areaOfResponsibility, securityClearance, workLocation,
                startDate, passwordHash, status, verificationCode, createdAt
            ];

            const adminResult = await client.query(adminQuery, adminValues);
            const adminId = adminResult.rows[0].id;

            // Insert reporting manager information
            const managerQuery = `
                INSERT INTO admin_reporting_managers (
                    admin_id, manager_name, manager_email, manager_phone
                ) VALUES ($1, $2, $3, $4)
            `;

            await client.query(managerQuery, [
                adminId, reportingManager.name, reportingManager.email, reportingManager.phone
            ]);

            // Insert two-factor authentication setup
            const twoFactorQuery = `
                INSERT INTO admin_two_factor_auth (
                    admin_id, method, enabled, secret
                ) VALUES ($1, $2, $3, $4)
            `;

            await client.query(twoFactorQuery, [
                adminId, twoFactorAuth.method, twoFactorAuth.enabled, twoFactorAuth.secret
            ]);

            // Insert security questions
            for (const question of securityQuestions) {
                await client.query(
                    'INSERT INTO admin_security_questions (admin_id, question, answer_hash) VALUES ($1, $2, $3)',
                    [adminId, question.question, question.answerHash]
                );
            }

            // Insert emergency contact
            const emergencyContactQuery = `
                INSERT INTO admin_emergency_contacts (
                    admin_id, name, phone, relationship
                ) VALUES ($1, $2, $3, $4)
            `;

            await client.query(emergencyContactQuery, [
                adminId, emergencyContact.name, emergencyContact.phone, emergencyContact.relationship
            ]);

            // Insert access permissions
            const permissionsQuery = `
                INSERT INTO admin_access_permissions (
                    admin_id, system_access, data_access
                ) VALUES ($1, $2, $3)
            `;

            await client.query(permissionsQuery, [
                adminId, JSON.stringify(accessPermissions.system), JSON.stringify(accessPermissions.data)
            ]);

            // Insert document references
            const documentsQuery = `
                INSERT INTO admin_documents (
                    admin_id, profile_photo_path, identification_path, education_path, 
                    resume_path, references_paths
                ) VALUES ($1, $2, $3, $4, $5, $6)
            `;

            await client.query(documentsQuery, [
                adminId,
                documents.profilePhoto ? documents.profilePhoto.path : null,
                documents.identification ? documents.identification.path : null,
                documents.education ? documents.education.path : null,
                documents.resume ? documents.resume.path : null,
                JSON.stringify(documents.references.map(ref => ref.path))
            ]);

            await client.query('COMMIT');

            return {
                id: adminId,
                email: email,
                employeeId: employeeId,
                status: status,
                createdAt: createdAt
            };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async findByEmail(email) {
        const query = `
            SELECT a.*, 
                   arm.manager_name, arm.manager_email, arm.manager_phone,
                   atfa.method as two_factor_method, atfa.enabled as two_factor_enabled,
                   aec.name as emergency_name, aec.phone as emergency_phone, aec.relationship,
                   aap.system_access, aap.data_access,
                   ad.profile_photo_path, ad.identification_path, ad.education_path, 
                   ad.resume_path, ad.references_paths
            FROM admins a
            LEFT JOIN admin_reporting_managers arm ON a.id = arm.admin_id
            LEFT JOIN admin_two_factor_auth atfa ON a.id = atfa.admin_id
            LEFT JOIN admin_emergency_contacts aec ON a.id = aec.admin_id
            LEFT JOIN admin_access_permissions aap ON a.id = aap.admin_id
            LEFT JOIN admin_documents ad ON a.id = ad.admin_id
            WHERE a.email = $1
        `;

        const result = await pool.query(query, [email]);
        return result.rows[0] || null;
    }

    static async findByEmployeeId(employeeId) {
        const query = `
            SELECT a.email, a.employee_id
            FROM admins a
            WHERE a.employee_id = $1
        `;

        const result = await pool.query(query, [employeeId]);
        return result.rows[0] || null;
    }

    static async findById(id) {
        const query = `
            SELECT a.*, 
                   arm.manager_name, arm.manager_email, arm.manager_phone,
                   atfa.method as two_factor_method, atfa.enabled as two_factor_enabled, atfa.secret as two_factor_secret,
                   aec.name as emergency_name, aec.phone as emergency_phone, aec.relationship,
                   aap.system_access, aap.data_access,
                   ad.profile_photo_path, ad.identification_path, ad.education_path, 
                   ad.resume_path, ad.references_paths
            FROM admins a
            LEFT JOIN admin_reporting_managers arm ON a.id = arm.admin_id
            LEFT JOIN admin_two_factor_auth atfa ON a.id = atfa.admin_id
            LEFT JOIN admin_emergency_contacts aec ON a.id = aec.admin_id
            LEFT JOIN admin_access_permissions aap ON a.id = aap.admin_id
            LEFT JOIN admin_documents ad ON a.id = ad.admin_id
            WHERE a.id = $1
        `;

        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return null;
        }

        const admin = result.rows[0];

        // Get security questions separately (without exposing answers)
        const securityQuery = 'SELECT question FROM admin_security_questions WHERE admin_id = $1';
        const securityResult = await pool.query(securityQuery, [id]);
        admin.security_questions = securityResult.rows.map(row => row.question);

        return admin;
    }

    static async updateStatus(id, status) {
        const query = 'UPDATE admins SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *';
        const result = await pool.query(query, [status, id]);
        return result.rows[0] || null;
    }

    static async verifyAdmin(verificationCode) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const query = 'SELECT id, email, status FROM admins WHERE verification_code = $1';
            const result = await client.query(query, [verificationCode]);

            if (result.rows.length === 0) {
                throw new Error('Invalid verification code');
            }

            const admin = result.rows[0];

            if (admin.status !== 'pending_manager_approval' && admin.status !== 'pending_verification') {
                throw new Error('Admin already verified or in different status');
            }

            // Update status to email verified
            await client.query(
                'UPDATE admins SET email_verified = $1, updated_at = NOW() WHERE id = $2',
                [true, admin.id]
            );

            await client.query('COMMIT');

            return admin;

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async authenticateAdmin(email, password) {
        const query = `
            SELECT a.id, a.email, a.password_hash, a.status, a.role, a.employee_id,
                   a.first_name, a.last_name, a.email_verified, a.phone_verified,
                   atfa.enabled as two_factor_enabled, atfa.method as two_factor_method
            FROM admins a
            LEFT JOIN admin_two_factor_auth atfa ON a.id = atfa.admin_id
            WHERE a.email = $1
        `;

        const result = await pool.query(query, [email]);
        
        if (result.rows.length === 0) {
            return null;
        }

        const admin = result.rows[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, admin.password_hash);
        if (!isValidPassword) {
            return null;
        }

        // Remove password hash from returned object
        delete admin.password_hash;

        return admin;
    }

    static async verifySecurityAnswer(adminId, question, answer) {
        const query = 'SELECT answer_hash FROM admin_security_questions WHERE admin_id = $1 AND question = $2';
        const result = await pool.query(query, [adminId, question]);

        if (result.rows.length === 0) {
            return false;
        }

        const answerHash = result.rows[0].answer_hash;
        return await bcrypt.compare(answer.toLowerCase(), answerHash);
    }

    static async updateTwoFactorAuth(adminId, enabled, secret = null) {
        const query = 'UPDATE admin_two_factor_auth SET enabled = $1, secret = $2 WHERE admin_id = $3 RETURNING *';
        const result = await pool.query(query, [enabled, secret, adminId]);
        return result.rows[0] || null;
    }

    static async getAllAdmins(filters = {}) {
        let query = `
            SELECT a.id, a.first_name, a.last_name, a.email, a.phone, a.employee_id,
                   a.role, a.department, a.security_clearance, a.work_location, a.status,
                   a.created_at, a.email_verified, a.phone_verified,
                   arm.manager_name, arm.manager_email
            FROM admins a
            LEFT JOIN admin_reporting_managers arm ON a.id = arm.admin_id
            WHERE 1=1
        `;

        const params = [];
        let paramCount = 0;

        if (filters.status) {
            paramCount++;
            query += ` AND a.status = $${paramCount}`;
            params.push(filters.status);
        }

        if (filters.role) {
            paramCount++;
            query += ` AND a.role = $${paramCount}`;
            params.push(filters.role);
        }

        if (filters.department) {
            paramCount++;
            query += ` AND a.department = $${paramCount}`;
            params.push(filters.department);
        }

        if (filters.securityClearance) {
            paramCount++;
            query += ` AND a.security_clearance = $${paramCount}`;
            params.push(filters.securityClearance);
        }

        query += ' ORDER BY a.created_at DESC';

        if (filters.limit) {
            paramCount++;
            query += ` LIMIT $${paramCount}`;
            params.push(filters.limit);
        }

        if (filters.offset) {
            paramCount++;
            query += ` OFFSET $${paramCount}`;
            params.push(filters.offset);
        }

        const result = await pool.query(query, params);
        return result.rows;
    }

    static async getAdminStats() {
        const query = `
            SELECT 
                COUNT(*) as total_admins,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_admins,
                COUNT(CASE WHEN status = 'pending_manager_approval' THEN 1 END) as pending_approval,
                COUNT(CASE WHEN status = 'pending_verification' THEN 1 END) as pending_verification,
                COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_admins,
                COUNT(CASE WHEN email_verified = true THEN 1 END) as email_verified_count,
                COUNT(CASE WHEN phone_verified = true THEN 1 END) as phone_verified_count
            FROM admins
        `;

        const result = await pool.query(query);
        return result.rows[0];
    }

    static async getPendingApprovals(managerId = null) {
        let query = `
            SELECT a.id, a.first_name, a.last_name, a.email, a.employee_id,
                   a.role, a.department, a.created_at,
                   arm.manager_name, arm.manager_email
            FROM admins a
            JOIN admin_reporting_managers arm ON a.id = arm.admin_id
            WHERE a.status = 'pending_manager_approval'
        `;

        const params = [];
        if (managerId) {
            query += ' AND arm.manager_email = $1';
            params.push(managerId);
        }

        query += ' ORDER BY a.created_at ASC';

        const result = await pool.query(query, params);
        return result.rows;
    }

    static async approveAdmin(adminId, approverId) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Update admin status
            await client.query(
                'UPDATE admins SET status = $1, approved_by = $2, approved_at = NOW(), updated_at = NOW() WHERE id = $3',
                ['approved', approverId, adminId]
            );

            // Log approval action
            await client.query(
                'INSERT INTO admin_approval_logs (admin_id, approved_by, action, created_at) VALUES ($1, $2, $3, NOW())',
                [adminId, approverId, 'approved']
            );

            await client.query('COMMIT');

            return await this.findById(adminId);

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async rejectAdmin(adminId, rejectedBy, reason) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Update admin status
            await client.query(
                'UPDATE admins SET status = $1, rejected_by = $2, rejection_reason = $3, rejected_at = NOW(), updated_at = NOW() WHERE id = $4',
                ['rejected', rejectedBy, reason, adminId]
            );

            // Log rejection action
            await client.query(
                'INSERT INTO admin_approval_logs (admin_id, approved_by, action, reason, created_at) VALUES ($1, $2, $3, $4, NOW())',
                [adminId, rejectedBy, 'rejected', reason]
            );

            await client.query('COMMIT');

            return await this.findById(adminId);

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = Admin;