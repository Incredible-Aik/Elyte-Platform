const { Pool } = require('pg');

// Database connection
const pool = new Pool({
    user: process.env.DB_USER || 'elyte_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'elyte_platform',
    password: process.env.DB_PASSWORD || 'elyte_password',
    port: process.env.DB_PORT || 5432,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

class Driver {
    static async create(driverData) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            const {
                firstName,
                lastName,
                email,
                phone,
                dateOfBirth,
                address,
                license,
                vehicle,
                insurance,
                mobileMoney,
                emergencyContact,
                workAvailability,
                profilePhotoPath,
                status,
                verificationCode,
                createdAt
            } = driverData;

            // Insert into drivers table
            const driverQuery = `
                INSERT INTO drivers (
                    first_name, last_name, email, phone, date_of_birth,
                    street_address, city, region,
                    profile_photo_path, status, verification_code, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING id
            `;

            const driverValues = [
                firstName, lastName, email, phone, dateOfBirth,
                address.street, address.city, address.region,
                profilePhotoPath, status, verificationCode, createdAt
            ];

            const driverResult = await client.query(driverQuery, driverValues);
            const driverId = driverResult.rows[0].id;

            // Insert license information
            const licenseQuery = `
                INSERT INTO driver_licenses (
                    driver_id, license_number, license_class, expiry_date, document_path
                ) VALUES ($1, $2, $3, $4, $5)
            `;

            await client.query(licenseQuery, [
                driverId, license.number, license.class, license.expiryDate, license.documentPath
            ]);

            // Insert vehicle information
            const vehicleQuery = `
                INSERT INTO driver_vehicles (
                    driver_id, make, model, year, license_plate, color
                ) VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id
            `;

            const vehicleResult = await client.query(vehicleQuery, [
                driverId, vehicle.make, vehicle.model, vehicle.year, vehicle.licensePlate, vehicle.color
            ]);
            const vehicleId = vehicleResult.rows[0].id;

            // Insert vehicle photos
            if (vehicle.photos && vehicle.photos.length > 0) {
                for (const photo of vehicle.photos) {
                    await client.query(
                        'INSERT INTO vehicle_photos (vehicle_id, file_path, file_name, file_size, mime_type) VALUES ($1, $2, $3, $4, $5)',
                        [vehicleId, photo.path, photo.filename, photo.size, photo.mimetype]
                    );
                }
            }

            // Insert insurance information
            const insuranceQuery = `
                INSERT INTO driver_insurance (
                    driver_id, provider, policy_number, expiry_date, document_path
                ) VALUES ($1, $2, $3, $4, $5)
            `;

            await client.query(insuranceQuery, [
                driverId, insurance.provider, insurance.policyNumber, insurance.expiryDate, insurance.documentPath
            ]);

            // Insert mobile money information
            const mobileMoneyQuery = `
                INSERT INTO driver_mobile_money (
                    driver_id, provider, phone_number, account_name
                ) VALUES ($1, $2, $3, $4)
            `;

            await client.query(mobileMoneyQuery, [
                driverId, mobileMoney.provider, mobileMoney.number, mobileMoney.accountName
            ]);

            // Insert emergency contact
            const emergencyContactQuery = `
                INSERT INTO driver_emergency_contacts (
                    driver_id, name, phone, relationship
                ) VALUES ($1, $2, $3, $4)
            `;

            await client.query(emergencyContactQuery, [
                driverId, emergencyContact.name, emergencyContact.phone, emergencyContact.relationship
            ]);

            // Insert work availability
            const workAvailabilityQuery = `
                INSERT INTO driver_work_availability (
                    driver_id, working_days, start_time, end_time
                ) VALUES ($1, $2, $3, $4)
            `;

            await client.query(workAvailabilityQuery, [
                driverId, JSON.stringify(workAvailability.days), workAvailability.startTime, workAvailability.endTime
            ]);

            await client.query('COMMIT');

            return {
                id: driverId,
                email: email,
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
            SELECT d.*, 
                   dl.license_number, dl.license_class, dl.expiry_date as license_expiry,
                   dv.make, dv.model, dv.year, dv.license_plate, dv.color,
                   di.provider as insurance_provider, di.policy_number, di.expiry_date as insurance_expiry,
                   dmm.provider as mobile_money_provider, dmm.phone_number as mobile_money_phone,
                   dec.name as emergency_name, dec.phone as emergency_phone, dec.relationship,
                   dwa.working_days, dwa.start_time, dwa.end_time
            FROM drivers d
            LEFT JOIN driver_licenses dl ON d.id = dl.driver_id
            LEFT JOIN driver_vehicles dv ON d.id = dv.driver_id
            LEFT JOIN driver_insurance di ON d.id = di.driver_id
            LEFT JOIN driver_mobile_money dmm ON d.id = dmm.driver_id
            LEFT JOIN driver_emergency_contacts dec ON d.id = dec.driver_id
            LEFT JOIN driver_work_availability dwa ON d.id = dwa.driver_id
            WHERE d.email = $1
        `;

        const result = await pool.query(query, [email]);
        return result.rows[0] || null;
    }

    static async findByLicenseNumber(licenseNumber) {
        const query = `
            SELECT d.email, dl.license_number
            FROM drivers d
            JOIN driver_licenses dl ON d.id = dl.driver_id
            WHERE dl.license_number = $1
        `;

        const result = await pool.query(query, [licenseNumber]);
        return result.rows[0] || null;
    }

    static async findById(id) {
        const query = `
            SELECT d.*, 
                   dl.license_number, dl.license_class, dl.expiry_date as license_expiry, dl.document_path as license_document,
                   dv.make, dv.model, dv.year, dv.license_plate, dv.color,
                   di.provider as insurance_provider, di.policy_number, di.expiry_date as insurance_expiry, di.document_path as insurance_document,
                   dmm.provider as mobile_money_provider, dmm.phone_number as mobile_money_phone, dmm.account_name,
                   dec.name as emergency_name, dec.phone as emergency_phone, dec.relationship,
                   dwa.working_days, dwa.start_time, dwa.end_time
            FROM drivers d
            LEFT JOIN driver_licenses dl ON d.id = dl.driver_id
            LEFT JOIN driver_vehicles dv ON d.id = dv.driver_id
            LEFT JOIN driver_insurance di ON d.id = di.driver_id
            LEFT JOIN driver_mobile_money dmm ON d.id = dmm.driver_id
            LEFT JOIN driver_emergency_contacts dec ON d.id = dec.driver_id
            LEFT JOIN driver_work_availability dwa ON d.id = dwa.driver_id
            WHERE d.id = $1
        `;

        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    static async updateStatus(id, status) {
        const query = 'UPDATE drivers SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *';
        const result = await pool.query(query, [status, id]);
        return result.rows[0] || null;
    }

    static async verifyDriver(verificationCode) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const query = 'SELECT id, email, status FROM drivers WHERE verification_code = $1';
            const result = await client.query(query, [verificationCode]);

            if (result.rows.length === 0) {
                throw new Error('Invalid verification code');
            }

            const driver = result.rows[0];

            if (driver.status !== 'pending_verification') {
                throw new Error('Driver already verified or in different status');
            }

            // Update status to verified
            await client.query(
                'UPDATE drivers SET status = $1, email_verified = $2, updated_at = NOW() WHERE id = $3',
                ['verified', true, driver.id]
            );

            await client.query('COMMIT');

            return driver;

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async getAllDrivers(filters = {}) {
        let query = `
            SELECT d.id, d.first_name, d.last_name, d.email, d.phone, d.city, d.region,
                   d.status, d.created_at, d.email_verified, d.phone_verified,
                   dv.make, dv.model, dv.year, dv.license_plate,
                   dl.license_class, dl.expiry_date as license_expiry
            FROM drivers d
            LEFT JOIN driver_vehicles dv ON d.id = dv.driver_id
            LEFT JOIN driver_licenses dl ON d.id = dl.driver_id
            WHERE 1=1
        `;

        const params = [];
        let paramCount = 0;

        if (filters.status) {
            paramCount++;
            query += ` AND d.status = $${paramCount}`;
            params.push(filters.status);
        }

        if (filters.city) {
            paramCount++;
            query += ` AND d.city = $${paramCount}`;
            params.push(filters.city);
        }

        if (filters.region) {
            paramCount++;
            query += ` AND d.region = $${paramCount}`;
            params.push(filters.region);
        }

        query += ' ORDER BY d.created_at DESC';

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

    static async getDriverStats() {
        const query = `
            SELECT 
                COUNT(*) as total_drivers,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_drivers,
                COUNT(CASE WHEN status = 'pending_verification' THEN 1 END) as pending_verification,
                COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified_drivers,
                COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_drivers,
                COUNT(CASE WHEN email_verified = true THEN 1 END) as email_verified_count,
                COUNT(CASE WHEN phone_verified = true THEN 1 END) as phone_verified_count
            FROM drivers
        `;

        const result = await pool.query(query);
        return result.rows[0];
    }
}

module.exports = Driver;