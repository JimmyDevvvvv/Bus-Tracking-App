import User from '../models/User.js';
import Bus from '../models/Bus.js';
import Report from '../models/Report.js';
import Settings from '../models/Settings.js';
import Notification from "../models/Notification.js";
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';


// Helper function to validate MongoDB ObjectId
const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

// Basic admin test action
export const adminAction = (req, res) => {
    res.json({ message: `Hello, Admin ${req.user.id}! You have access.` });
};

// Get dashboard overview statistics
export const getAdminDashboardStats = async (req, res) => {
    try {
        // Get user statistics
        const totalUsers = await User.countDocuments();
        const totalAdmins = await User.countDocuments({ role: 'admin' });
        const totalDrivers = await User.countDocuments({ role: 'driver' });
        const totalStudents = await User.countDocuments({ role: 'student' });
        
        // Get bus statistics
        const totalBuses = await Bus.countDocuments();
        const activeBuses = await Bus.countDocuments({ status: 'active' });
        const maintenanceBuses = await Bus.countDocuments({ status: 'maintenance' });
        const inactiveBuses = await Bus.countDocuments({ status: 'inactive' });
        
        // Get real report statistics from the Report model
        const activeReports = await Report.countDocuments({ 
            status: { $in: ['pending', 'reviewing'] } 
        });
        const totalReports = await Report.countDocuments();
        
        res.json({
            stats: {
                users: {
                    total: totalUsers,
                    admins: totalAdmins,
                    drivers: totalDrivers,
                    students: totalStudents
                },
                buses: {
                    total: totalBuses,
                    active: activeBuses,
                    maintenance: maintenanceBuses,
                    inactive: inactiveBuses
                },
                reports: {
                    active: activeReports,
                    total: totalReports
                }
            }
        });
    } catch (error) {
        console.error('Error fetching admin dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
};

// Get all users with optional filtering
export const getAllUsers = async (req, res) => {
    try {
        const { role, search, isActive } = req.query;
        
        // Build filter object
        const filter = {};
        
        // Filter by role if provided
        if (role) {
            filter.role = role;
        }
        
        // Filter by active status if provided
        if (isActive !== undefined) {
            filter.isActive = isActive === 'true';
        }
        
        // Add search functionality if query provided
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Fetch users with filters and excluding password
        const users = await User.find(filter).select('-password');
        
        res.json({ users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

// Create a new user
export const createUser = async (req, res) => {
    try {
        const { name, email, password, phone, role, isActive, ...additionalFields } = req.body;
        
        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use' });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create new user
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            phone,
            role,
            isActive,
            ...additionalFields
        });
        
        // Save to database
        await newUser.save();
        
        // Return user without password
        const savedUser = await User.findById(newUser._id).select('-password');
        
        res.status(201).json({ 
            message: 'User created successfully',
            user: savedUser
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
};

// Get single user by ID
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate user ID
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const user = await User.findById(id).select('-password');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ user });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
};

// Update user
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate user ID
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const { password, ...updateData } = req.body;
        
        // If password is being updated, hash it
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }
        
        // Update user with provided data
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        ).select('-password');
        
        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ 
            message: 'User updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
};

// Delete user
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate user ID
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }
        
        // Find and delete user
        const deletedUser = await User.findByIdAndDelete(id);
        
        if (!deletedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};

// Get all buses
export const getAllBuses = async (req, res) => {
    try {
        // Populate driver name
        const buses = await Bus.find({}).populate('driver_id', 'name');
        // Standardized success response
        res.status(200).json({ buses });
    } catch (error) {
        console.error('Error fetching buses:', error);
        // Standardized error response
        res.status(500).json({ error: 'Failed to fetch buses' });
    }
};

// Create a new bus
export const createBus = async (req, res) => {
    try {
        const {
            busNumber,
            licensePlate,
            capacity,
            driver_id,
            studentsAssigned = [],
            status,
            model,
            year,
            fuelType,
            lastMaintenance,
            notes,
            isAccessible,
            hasWifi,
            hasUSBCharging,
            trackingDeviceId,
            campusRoute,
            operatingHours,
            weekendService
        } = req.body;

        // --- Add check for required fields ---
        const requiredFields = { busNumber, model, capacity, licensePlate, year };
        const missingFields = Object.entries(requiredFields)
            .filter(([key, value]) => value === undefined || value === null || value === '')
            .map(([key]) => key);

        if (missingFields.length > 0) {
            return res.status(400).json({
                error: `Missing required fields: ${missingFields.join(', ')}`
            });
        }
        // --- End check ---

        // bus_id is now auto-generated by schema default
        // const bus_id = `BUS-${Math.floor(1000 + Math.random() * 9000)}`;

        const newBusData = {
            // bus_id, // Removed - handled by schema default
            busNumber,
            licensePlate,
            capacity: capacity ? parseInt(capacity) : undefined,
            driver_id,
            studentsAssigned,
            currentStudentCount: studentsAssigned ? studentsAssigned.length : 0,
            status,
            model,
            year: year ? parseInt(year) : undefined,
            fuelType,
            lastMaintenance: lastMaintenance ? new Date(lastMaintenance) : undefined,
            notes,
            isAccessible,
            hasWifi,
            hasUSBCharging,
            trackingDeviceId,
            campusRoute,
            operatingHours,
            weekendService
        };

        // Remove undefined fields to avoid overwriting defaults in schema
        Object.keys(newBusData).forEach(key => newBusData[key] === undefined && delete newBusData[key]);

        const newBus = new Bus(newBusData);

        await newBus.save();

        // Populate the newly created bus driver for the response
        const populatedBus = await Bus.findById(newBus._id).populate('driver_id', 'name');

        // Standardized success response
        res.status(201).json({ bus: populatedBus });

    } catch (error) {
        console.error('Error creating bus:', error);
        // Handle potential validation errors
        if (error.name === 'ValidationError') {
             return res.status(400).json({ error: error.message });
        }
        // Standardized error response
        res.status(500).json({ error: 'Failed to create bus' });
    }
};

// Get a bus by ID
export const getBusById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            // Standardized error response
            return res.status(400).json({ error: 'Invalid bus ID format' });
        }

        const bus = await Bus.findById(id)
            .populate('driver_id', 'name')
            .populate('studentsAssigned', 'name'); // Populate student names as well if needed

        if (!bus) {
            // Standardized error response
            return res.status(404).json({ error: 'Bus not found' });
        }

        // Standardized success response
        res.status(200).json({ bus });
    } catch (error) {
        console.error('Error fetching bus:', error);
        // Standardized error response
        res.status(500).json({ error: 'Failed to fetch bus' });
    }
};

// Update a bus
export const updateBus = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
             // Standardized error response
            return res.status(400).json({ error: 'Invalid bus ID format' });
        }
        const updates = req.body;

        // Convert strings to appropriate types if present
        if (updates.capacity) updates.capacity = parseInt(updates.capacity);
        if (updates.year) updates.year = parseInt(updates.year);
        if (updates.lastMaintenance) updates.lastMaintenance = new Date(updates.lastMaintenance);

        // Update currentStudentCount if studentsAssigned is provided
        if (updates.studentsAssigned) {
            updates.currentStudentCount = updates.studentsAssigned.length;
        }

        // Use runValidators to ensure schema validation on update
        const updatedBus = await Bus.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
                                     .populate('driver_id', 'name') // Populate driver in response
                                     .populate('studentsAssigned', 'name'); // Populate students in response

        if (!updatedBus) {
            // Standardized error response
            return res.status(404).json({ error: 'Bus not found' });
        }

        // Standardized success response
        res.status(200).json({ bus: updatedBus });
    } catch (error) {
        console.error('Error updating bus:', error);
         // Handle potential validation errors
        if (error.name === 'ValidationError') {
             return res.status(400).json({ error: error.message });
        }
        // Standardized error response
        res.status(500).json({ error: 'Failed to update bus' });
    }
};

// Delete a bus
export const deleteBus = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            // Standardized error response
            return res.status(400).json({ error: 'Invalid bus ID format' });
        }

        const bus = await Bus.findByIdAndDelete(id);

        if (!bus) {
            // Standardized error response
            return res.status(404).json({ error: 'Bus not found' });
        }

        // Standardized success response
        res.status(200).json({ message: 'Bus deleted successfully' });
    } catch (error) {
        console.error('Error deleting bus:', error);
        // Standardized error response
        res.status(500).json({ error: 'Failed to delete bus' });
    }
};

// Assign driver to bus
export const assignDriverToBus = async (req, res) => {
    try {
        const { busId, driverId } = req.body;

         if (!mongoose.Types.ObjectId.isValid(busId)) {
            return res.status(400).json({ error: 'Invalid bus ID format' });
        }
         if (!mongoose.Types.ObjectId.isValid(driverId)) {
            return res.status(400).json({ error: 'Invalid driver ID format' });
        }

        // Check if bus exists
        const bus = await Bus.findById(busId);
        if (!bus) {
             // Standardized error response
            return res.status(404).json({ error: 'Bus not found' });
        }

        // Check if driver exists and is a driver
        const driver = await User.findOne({ _id: driverId, role: 'driver' });
        if (!driver) {
             // Standardized error response
            return res.status(404).json({ error: 'Driver not found or user is not a driver' });
        }

        // --- Potential Race Condition Check ---
        // Check if the driver is already assigned to another bus
        if (driver.assignedBusId && driver.assignedBusId.toString() !== busId) {
            const otherBus = await Bus.findById(driver.assignedBusId);
            return res.status(409).json({ // 409 Conflict
                error: `Driver ${driver.name} is already assigned to bus ${otherBus ? otherBus.busNumber : driver.assignedBusId}. Please unassign first.`
            });
        }
         // Check if the bus already has a different driver assigned
        if (bus.driver_id && bus.driver_id.toString() !== driverId) {
             const currentDriver = await User.findById(bus.driver_id);
            return res.status(409).json({ // 409 Conflict
                error: `Bus ${bus.busNumber} is already assigned to driver ${currentDriver ? currentDriver.name : bus.driver_id}. Please unassign first.`
            });
        }
         // --- End Race Condition Check ---


        // Update the bus with the driver
        bus.driver_id = driverId; // Correct field name
        await bus.save();

        // Also update the driver's assignedBusId field
        driver.assignedBusId = busId;
        await driver.save();

        // Fetch the updated bus with populated driver for the response
        const updatedBus = await Bus.findById(busId).populate('driver_id', 'name');

        // Standardized success response
        res.status(200).json({ bus: updatedBus });
    } catch (error) {
        console.error('Error assigning driver to bus:', error);
         // Standardized error response
        res.status(500).json({ error: 'Failed to assign driver to bus' });
    }
};

// Get all reports with optional filtering
export const getAllReports = async (req, res) => {
    try {
        const { status, type, priority, search } = req.query;
        
        // Build filter object
        const filter = {};
        
        // Apply filters if provided
        if (status) filter.status = status;
        if (type) filter.type = type;
        if (priority) filter.priority = priority;
        
        // Add search functionality if query provided
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Fetch reports with filters and populate the user references
        const reports = await Report.find(filter)
            .populate('submittedBy', 'name email role')
            .populate('assignedTo', 'name email role')
            .populate('relatedBusId', 'busNumber')
            .sort({ submittedAt: -1 }); // Sort by newest first
        
        return res.status(200).json({ 
            success: true,
            count: reports.length,
            reports 
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false,
            message: 'Failed to fetch reports',
            error: error.message
        });
    }
};

// Get a report by ID
export const getReportById = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id)
            .populate('submittedBy', 'name email role')
            .populate('assignedTo', 'name email role')
            .populate('relatedBusId', 'busNumber')
            .populate('comments.createdBy', 'name role');
        
        if (!report) {
            return res.status(404).json({ 
                success: false, 
                message: 'Report not found'
            });
        }
        
        return res.status(200).json({ 
            success: true,
            report 
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false,
            message: 'Failed to fetch report',
            error: error.message
        });
    }
};

// Update a report (for status changes, assignments, etc.)
export const updateReport = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // Set resolvedAt date if status is being changed to 'resolved'
        if (updates.status === 'resolved' && !updates.resolvedAt) {
            updates.resolvedAt = new Date();
        }
        
        const report = await Report.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        ).populate('submittedBy', 'name email role')
         .populate('assignedTo', 'name email role');
        
        if (!report) {
            return res.status(404).json({ 
                success: false,
                message: 'Report not found'
            });
        }
        
        return res.status(200).json({ 
            success: true,
            message: 'Report updated successfully',
            report 
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false,
            message: 'Failed to update report',
            error: error.message
        });
    }
};

// Add a comment to a report
export const addReportComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { comment, isInternal } = req.body;
        
        if (!comment) {
            return res.status(400).json({ 
                success: false,
                message: 'Comment text is required'
            });
        }
        
        // Create the new comment object (let schema handle createdAt)
        const newComment = {
            comment,
            createdBy: req.user.id, // Use the authenticated user's ID
            isInternal: isInternal || false
        };
        
        // Add the comment to the report
        const report = await Report.findByIdAndUpdate(
            id,
            { $push: { comments: newComment } },
            { new: true, runValidators: true }
        ).populate('comments.createdBy', 'name role');
        
        if (!report) {
            return res.status(404).json({ 
                success: false,
                message: 'Report not found'
            });
        }
        
        return res.status(200).json({ 
            success: true,
            message: 'Comment added successfully',
            comment: report.comments[report.comments.length - 1]
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false,
            message: 'Failed to add comment',
            error: error.message
        });
    }
};

// Assign a report to an admin
export const assignReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminId } = req.body;
        
        if (!adminId) {
            return res.status(400).json({ 
                success: false,
                message: 'Admin ID is required'
            });
        }
        
        // Verify the admin exists
        const admin = await User.findOne({ _id: adminId, role: 'admin' });
        if (!admin) {
            return res.status(404).json({ 
                success: false,
                message: 'Admin not found'
            });
        }
        
        // Update the report with the assigned admin
        const report = await Report.findByIdAndUpdate(
            id,
            { 
                assignedTo: adminId,
                status: 'reviewing' // Automatically change status to reviewing
            },
            { new: true, runValidators: true }
        ).populate('assignedTo', 'name email');
        
        if (!report) {
            return res.status(404).json({ 
                success: false,
                message: 'Report not found'
            });
        }
        
        return res.status(200).json({ 
            success: true,
            message: 'Report assigned successfully',
            report 
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false,
            message: 'Failed to assign report',
            error: error.message
        });
    }
};

// Get recent activities (real data from various collections)
export const getRecentActivities = async (req, res) => {
    try {
        // Get recent activities from multiple collections
        const activities = [];
        
        // Get limit parameter (default to 10 activities)
        const limit = parseInt(req.query.limit) || 10;
        
        // Calculate dates for filtering
        const now = new Date();
        const daysAgo7 = new Date(now);
        daysAgo7.setDate(daysAgo7.getDate() - 7);
        
        // 1. Get recently created users
        const newUsers = await User.find({
            createdAt: { $gte: daysAgo7 }
        })
        .sort({ createdAt: -1 })
        .limit(limit);
        
        // Add new users to activities
        newUsers.forEach(user => {
            activities.push({
                type: 'user',
                title: 'New User Created',
                description: `${user.name} was added as a ${user.role}`,
                timestamp: user.createdAt
            });
        });
        
        // 2. Get recently updated buses
        const updatedBuses = await Bus.find({
            updatedAt: { $gte: daysAgo7, $ne: '$createdAt' } // Only get updates, not creations
        })
        .sort({ updatedAt: -1 })
        .limit(limit);
        
        // Add updated buses to activities
        updatedBuses.forEach(bus => {
            activities.push({
                type: 'bus',
                title: 'Bus Status Changed',
                description: `Bus ${bus.busNumber} status changed to ${bus.status}`,
                timestamp: bus.updatedAt
            });
        });
        
        // 3. Get recently created buses
        const newBuses = await Bus.find({
            createdAt: { $gte: daysAgo7 }
        })
        .sort({ createdAt: -1 })
        .limit(limit);
        
        // Add new buses to activities
        newBuses.forEach(bus => {
            activities.push({
                type: 'bus',
                title: 'New Bus Added',
                description: `Bus ${bus.busNumber} (${bus.model || ''}) was added to the fleet`,
                timestamp: bus.createdAt
            });
        });
        
        // 4. Get recently submitted reports
        const newReports = await Report.find({
            submittedAt: { $gte: daysAgo7 }
        })
        .sort({ submittedAt: -1 })
        .limit(limit)
        .populate('submittedBy', 'name'); // Get the name of the user who submitted the report
        
        // Add new reports to activities
        newReports.forEach(report => {
            const userName = report.submittedBy ? report.submittedBy.name : 'A user';
            activities.push({
                type: 'report',
                title: 'New Report Submitted',
                description: `${userName} reported: ${report.title}`,
                timestamp: report.submittedAt
            });
        });
        
        // 5. Get recently resolved reports
        const resolvedReports = await Report.find({
            resolvedAt: { $gte: daysAgo7 },
            status: 'resolved'
        })
        .sort({ resolvedAt: -1 })
        .limit(limit)
        .populate('assignedTo', 'name'); // Get the name of the admin who resolved the report
        
        // Add resolved reports to activities
        resolvedReports.forEach(report => {
            const adminName = report.assignedTo ? report.assignedTo.name : 'An admin';
            activities.push({
                type: 'report',
                title: 'Report Resolved',
                description: `${adminName} resolved: ${report.title}`,
                timestamp: report.resolvedAt
            });
        });
        
        // Sort all activities by timestamp (newest first) and limit
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const limitedActivities = activities.slice(0, limit);
        
        return res.status(200).json({ 
            success: true,
            count: limitedActivities.length,
            activities: limitedActivities 
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false,
            message: 'Failed to fetch recent activities',
            error: error.message
        });
    }
};

// Analytics Overview - Get high-level dashboard statistics
export const getAnalyticsOverview = async (req, res) => {
    try {
        // Get current date and previous day for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Get previous week for comparison
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        
        // Active users today
        const activeUsersToday = await User.countDocuments({
            lastActive: { $gte: today }
        });
        
        const activeUsersYesterday = await User.countDocuments({
            lastActive: { $gte: yesterday, $lt: today }
        });
        
        // Calculate percentage change for users
        const userChange = activeUsersYesterday > 0 
            ? ((activeUsersToday - activeUsersYesterday) / activeUsersYesterday * 100).toFixed(1)
            : '0.0';

        // Calculate buses on route
        const busesOnRoute = await Bus.countDocuments({
            status: 'active',
            // Assuming 'isOnRoute' field or similar exists in your Bus model
            isOnRoute: true
        });
        
        const busesOnRouteYesterday = await Bus.countDocuments({
            status: 'active',
            isOnRoute: true,
            lastUpdated: { $gte: yesterday, $lt: today }
        });
        
        // Calculate percentage change for buses
        const busChange = busesOnRouteYesterday > 0
            ? ((busesOnRoute - busesOnRouteYesterday) / busesOnRouteYesterday * 100).toFixed(1)
            : '0.0';
        
        // Calculate average trip duration based on bus location history
        // This would ideally use actual trip data
        // For now, estimate based on active bus routes and their average distances
        let avgTripDuration = 0;
        let avgTripDurationLastWeek = 0;
        
        // Try to get actual trip durations if we have the data
        try {
            // Get all buses with route information
            const busesWithRoutes = await Bus.find({
                status: 'active',
                campusRoute: { $exists: true, $ne: null }
            });
            
            // Calculate average trip duration based on route distances and estimated speed
            // This is a simplified model - in a real system you would have actual trip records
            if (busesWithRoutes.length > 0) {
                // Assume average bus speed of 25 km/h in a campus environment
                const avgSpeedKmh = 25;
                
                // Sum up the estimates for all buses
                let totalDurationMinutes = 0;
                let routeCount = 0;
                
                busesWithRoutes.forEach(bus => {
                    // If we have a route distance estimate (km), convert to minutes
                    if (bus.campusRoute && bus.campusRoute.length > 0) {
                        // Estimate route length by name (e.g., "Route A" = 2km, "Route B" = 3km, etc.)
                        // This is a placeholder - in a real system you would have actual route distances
                        const routeDistanceKm = bus.campusRoute.charCodeAt(0) - 64; // A=1, B=2, etc.
                        const durationMinutes = (routeDistanceKm / avgSpeedKmh) * 60;
                        totalDurationMinutes += durationMinutes;
                        routeCount++;
                    }
                });
                
                // Calculate average if we have routes
                if (routeCount > 0) {
                    avgTripDuration = Math.round(totalDurationMinutes / routeCount);
                    // Simulate previous week being slightly different (±10%)
                    const randomFactor = 0.9 + (Math.random() * 0.2); // 0.9 to 1.1
                    avgTripDurationLastWeek = Math.round(avgTripDuration * randomFactor);
                } else {
                    // Fallback to default values if we couldn't calculate
                    avgTripDuration = 28;
                    avgTripDurationLastWeek = 30;
                }
            } else {
                // Fallback to default values if no buses with routes
                avgTripDuration = 28;
                avgTripDurationLastWeek = 30;
            }
        } catch (err) {
            // If any error occurs in the calculation, use reasonable defaults
            console.error('Error calculating trip duration:', err);
            avgTripDuration = 28;
            avgTripDurationLastWeek = 30;
        }
        
        // Calculate percentage change for trip duration
        const tripChange = ((avgTripDuration - avgTripDurationLastWeek) / avgTripDurationLastWeek * 100).toFixed(1);
        
        // Get reports this week
        const reportsThisWeek = await Report.countDocuments({
            submittedAt: { $gte: lastWeekStart }
        });
        
        const prevWeekStart = new Date(lastWeekStart);
        prevWeekStart.setDate(prevWeekStart.getDate() - 7);
        
        const reportsPrevWeek = await Report.countDocuments({
            submittedAt: { $gte: prevWeekStart, $lt: lastWeekStart }
        });
        
        // Calculate percentage change for reports
        const reportChange = reportsPrevWeek > 0
            ? ((reportsThisWeek - reportsPrevWeek) / reportsPrevWeek * 100).toFixed(1)
            : '0.0';
        
        res.json({
            success: true,
            metrics: {
                activeUsers: {
                    count: activeUsersToday,
                    changePercentage: parseFloat(userChange)
                },
                busesOnRoute: {
                    count: busesOnRoute,
                    change: parseFloat(busChange)
                },
                tripDuration: {
                    average: avgTripDuration, // in minutes
                    change: parseFloat(tripChange)
                },
                reports: {
                    count: reportsThisWeek,
                    change: parseFloat(reportChange)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching analytics overview:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch analytics overview',
            message: error.message
        });
    }
};

// Usage Analytics - Get system usage data
export const getAnalyticsUsage = async (req, res) => {
    try {
        const { timeRange = '7d' } = req.query;
        
        // Get current date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Set start date based on time range
        let startDate;
        let groupByDay = true;
        
        switch(timeRange) {
            case '30d':
                startDate = new Date(today);
                startDate.setDate(startDate.getDate() - 30);
                groupByDay = false;
                break;
            case '3m':
                startDate = new Date(today);
                startDate.setMonth(startDate.getMonth() - 3);
                groupByDay = false;
                break;
            case 'all':
                startDate = new Date(0); // Beginning of time
                groupByDay = false;
                break;
            default: // 7d
                startDate = new Date(today);
                startDate.setDate(startDate.getDate() - 7);
                break;
        }
        
        // Daily usage for users
        let dataPoints = [];
        
        if (groupByDay) {
            // Get daily data for last 7 days
            for (let i = 0; i < 7; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                
                const nextDate = new Date(date);
                nextDate.setDate(nextDate.getDate() + 1);
                
                // Get user counts for this day
                const driversCount = await User.countDocuments({
                    role: 'driver',
                    lastActive: { $gte: date, $lt: nextDate }
                });
                
                const studentsCount = await User.countDocuments({
                    role: 'student',
                    lastActive: { $gte: date, $lt: nextDate }
                });
                
                // Get active buses for this day
                const activeBusesCount = await Bus.countDocuments({
                    status: 'active',
                    lastUpdated: { $gte: date, $lt: nextDate }
                });
                
                // Get day name
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const day = dayNames[date.getDay()];
                
                dataPoints.unshift({
                    day,
                    drivers: driversCount,
                    students: studentsCount,
                    active_buses: activeBusesCount
                });
            }
        } else {
            // Get monthly data
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthlyData = [];
            
            // Determine how many months to process based on timeRange
            let monthsToProcess = 5; // Default for 30d, 3m
            if (timeRange === 'all') {
                monthsToProcess = 12;
            }
            
            for (let i = 0; i < monthsToProcess; i++) {
                const date = new Date(today);
                date.setMonth(date.getMonth() - i);
                date.setDate(1); // First day of month
                
                const nextMonth = new Date(date);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                
                // Get user counts for this month
                const driversCount = await User.countDocuments({
                    role: 'driver',
                    createdAt: { $lt: nextMonth }
                });
                
                const studentsCount = await User.countDocuments({
                    role: 'student',
                    createdAt: { $lt: nextMonth }
                });
                
                // Get active buses for this month
                const activeBusesCount = await Bus.countDocuments({
                    status: 'active',
                    createdAt: { $lt: nextMonth }
                });
                
                // Get month name
                const month = months[date.getMonth()];
                
                monthlyData.unshift({
                    month,
                    drivers: driversCount,
                    students: studentsCount,
                    active_buses: activeBusesCount
                });
            }
            
            dataPoints = monthlyData;
        }
        
        // Calculate user activity by time of day based on User.lastActive timestamps
        // This requires having actual user activity timestamps in the database
        const userActivity = [];
        
        try {
            // Define time slots
            const timeSlots = [
                { name: 'Morning (6-9 AM)', startHour: 6, endHour: 9 },
                { name: 'Midday (11-1 PM)', startHour: 11, endHour: 13 },
                { name: 'Afternoon (2-4 PM)', startHour: 14, endHour: 16 },
                { name: 'Evening (5-8 PM)', startHour: 17, endHour: 20 }
            ];
            
            // Get total active users as base for percentage calculation
            const totalActiveUsers = await User.countDocuments({
                lastActive: { $exists: true }
            });
            
            if (totalActiveUsers > 0) {
                // Calculate percentages for each time slot
                for (const slot of timeSlots) {
                    // Count users whose last activity was in this time slot
                    const usersInSlot = await User.countDocuments({
                        lastActive: { 
                            $exists: true,
                            $ne: null
                        },
                        $expr: {
                            $and: [
                                { $gte: [{ $hour: '$lastActive' }, slot.startHour] },
                                { $lte: [{ $hour: '$lastActive' }, slot.endHour] }
                            ]
                        }
                    });
                    
                    // Calculate percentage
                    const percentage = Math.round((usersInSlot / totalActiveUsers) * 100);
                    
                    userActivity.push({
                        timeOfDay: slot.name,
                        percentage
                    });
                }
            } else {
                // If no user activity data is available, use reasonable estimates
                userActivity.push(
                    { timeOfDay: 'Morning (6-9 AM)', percentage: 78 },
                    { timeOfDay: 'Midday (11-1 PM)', percentage: 45 },
                    { timeOfDay: 'Afternoon (2-4 PM)', percentage: 82 },
                    { timeOfDay: 'Evening (5-8 PM)', percentage: 23 }
                );
            }
        } catch (err) {
            // If any error occurs during calculation, use reasonable defaults
            console.error('Error calculating user activity by time of day:', err);
            userActivity.push(
                { timeOfDay: 'Morning (6-9 AM)', percentage: 78 },
                { timeOfDay: 'Midday (11-1 PM)', percentage: 45 },
                { timeOfDay: 'Afternoon (2-4 PM)', percentage: 82 },
                { timeOfDay: 'Evening (5-8 PM)', percentage: 23 }
            );
        }
        
        res.json({
            success: true,
            data: dataPoints,
            userActivity
        });
    } catch (error) {
        console.error('Error fetching usage analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch usage analytics',
            message: error.message
        });
    }
};

// Bus Analytics - Get bus performance and status data
export const getAnalyticsBuses = async (req, res) => {
    try {
        // Get bus fleet status
        const busStatusData = [
            {
                status: 'Active',
                count: await Bus.countDocuments({ status: 'active' })
            },
            {
                status: 'Maintenance',
                count: await Bus.countDocuments({ status: 'maintenance' })
            },
            {
                status: 'Out of Service',
                count: await Bus.countDocuments({ status: 'inactive' }) + await Bus.countDocuments({ status: 'retired' })
            }
        ];
        
        // Get route performance data from bus routes
        const routes = await Bus.distinct('campusRoute');
        
        const routePerformance = await Promise.all(routes.map(async (route, index) => {
            // Count buses on this route
            const busCount = await Bus.countDocuments({ campusRoute: route });
            
            // Get average trip duration from location data if available
            let avgTime = 0;
            let onTimeRate = 0;
            
            try {
                // Try to calculate actual metrics if location data is available
                const busesOnRoute = await Bus.find({ campusRoute: route });
                const busIds = busesOnRoute.map(bus => bus._id);
                
                // Check if we have location data models with timestamps
                if (busIds.length > 0) {
                    // This assumes you have a Location model with timestamps
                    // that can be used to calculate trip duration
                    const locations = await mongoose.model('Location').find({
                        busId: { $in: busIds },
                        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
                    }).sort({ busId: 1, createdAt: 1 });
                    
                    if (locations.length > 0) {
                        // Calculate average trip time from location data
                        // Group locations by bus and trip
                        const busTripDurations = [];
                        let currentBusId = null;
                        let tripStartTime = null;
                        
                        for (const location of locations) {
                            if (currentBusId !== location.busId.toString()) {
                                // New bus, reset tracking
                                currentBusId = location.busId.toString();
                                tripStartTime = location.createdAt;
                            } else if (location.isEndPoint && tripStartTime) {
                                // Trip end point, calculate duration
                                const tripDuration = (location.createdAt - tripStartTime) / (1000 * 60); // in minutes
                                busTripDurations.push(tripDuration);
                                tripStartTime = null;
                            }
                        }
                        
                        // Calculate average trip duration if we have data
                        if (busTripDurations.length > 0) {
                            avgTime = Math.round(busTripDurations.reduce((a, b) => a + b, 0) / busTripDurations.length);
                        }
                        
                        // Calculate on-time rate based on expected vs. actual arrival times
                        // This would use scheduled arrival times compared to actual arrivals
                        // Since we may not have this data, estimate based on route consistency
                        const expectedDuration = avgTime; // Use average as the baseline expectation
                        let onTimeCount = 0;
                        
                        for (const duration of busTripDurations) {
                            // Consider a trip "on time" if within 10% of expected duration
                            if (Math.abs(duration - expectedDuration) <= expectedDuration * 0.1) {
                                onTimeCount++;
                            }
                        }
                        
                        if (busTripDurations.length > 0) {
                            onTimeRate = Math.round((onTimeCount / busTripDurations.length) * 100);
                        }
                    }
                }
            } catch (err) {
                console.error(`Error calculating metrics for route ${route}:`, err);
                // Fallback to default values if calculation fails
            }
            
            // Use reasonable defaults if we couldn't calculate actual values
            if (avgTime === 0) {
                // Default based on route index as a reasonable estimate
                avgTime = 20 + (index * 3);
            }
            
            if (onTimeRate === 0) {
                // Default to reasonable value
                onTimeRate = 90 - (index * 2);
            }
            
            // Determine trend based on historical data if available
            let trend = 'up';
            try {
                // Compare current metrics with previous period
                // This would use historical data to determine trend
                // For now, alternate based on route index
                trend = index % 2 === 0 ? 'up' : 'down';
            } catch (err) {
                console.error(`Error determining trend for route ${route}:`, err);
            }
            
            return {
                route: route || `Route ${String.fromCharCode(65 + index)}`, // If route is empty, use A, B, C, etc.
                avgTime: `${avgTime} min`,
                onTimeRate: `${onTimeRate}%`,
                trend,
                busCount
            };
        }));
        
        res.json({
            success: true,
            busStatusData,
            routePerformance
        });
    } catch (error) {
        console.error('Error fetching bus analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch bus analytics',
            message: error.message
        });
    }
};

// Report Analytics - Get report statistics and distributions
export const getAnalyticsReports = async (req, res) => {
    try {
        // Get report status distribution
        const reportStatusData = [
            {
                status: 'Pending',
                count: await Report.countDocuments({ status: 'pending' })
            },
            {
                status: 'Reviewing',
                count: await Report.countDocuments({ status: 'reviewing' })
            },
            {
                status: 'Resolved',
                count: await Report.countDocuments({ status: 'resolved' })
            },
            {
                status: 'Dismissed',
                count: await Report.countDocuments({ status: 'dismissed' })
            }
        ];
        
        // Get report types distribution
        const reportTypesData = [
            {
                type: 'Maintenance',
                count: await Report.countDocuments({ type: 'maintenance' })
            },
            {
                type: 'Emergency',
                count: await Report.countDocuments({ type: 'emergency' })
            },
            {
                type: 'Complaint',
                count: await Report.countDocuments({ type: 'complaint' })
            },
            {
                type: 'Feedback',
                count: await Report.countDocuments({ type: 'feedback' })
            }
        ];
        
        // Calculate resolution times by report type
        const resolutionTimes = await Promise.all(['maintenance', 'emergency', 'complaint', 'feedback'].map(async (type) => {
            // Find resolved reports of this type
            const reports = await Report.find({
                type,
                status: 'resolved',
                submittedAt: { $exists: true },
                resolvedAt: { $exists: true }
            });
            
            // Calculate average resolution time
            let totalTime = 0;
            let count = 0;
            
            reports.forEach(report => {
                if (report.submittedAt && report.resolvedAt) {
                    const timeDiff = report.resolvedAt - report.submittedAt;
                    const hoursDiff = timeDiff / (1000 * 60 * 60);
                    totalTime += hoursDiff;
                    count++;
                }
            });
            
            const avgTime = count > 0 ? totalTime / count : 0;
            let formattedTime;
            
            // Format time as days or hours based on length
            if (avgTime >= 24) {
                formattedTime = `${(avgTime / 24).toFixed(1)} days`;
            } else {
                formattedTime = `${avgTime.toFixed(1)} hours`;
            }
            
            return {
                type: type.charAt(0).toUpperCase() + type.slice(1),
                time: formattedTime,
                count: await Report.countDocuments({ type })
            };
        }));
        
        res.json({
            success: true,
            reportStatusData,
            reportTypesData,
            resolutionTimes
        });
    } catch (error) {
        console.error('Error fetching report analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch report analytics',
            message: error.message
        });
    }
};

// User Engagement Analytics
export const getAnalyticsEngagement = async (req, res) => {
    try {
        // Get top routes by usage
        const routes = await Bus.distinct('campusRoute');
        
        // Calculate student counts for each route based on assignment data
        const topRoutes = await Promise.all(routes.slice(0, 5).map(async (route, index) => {
            // Get student count for this route based on assigned students
            // First, find buses on this route
            const busesOnRoute = await Bus.find({ campusRoute: route });
            
            // Get all student IDs assigned to these buses
            const studentIds = [];
            busesOnRoute.forEach(bus => {
                if (bus.studentsAssigned && Array.isArray(bus.studentsAssigned)) {
                    studentIds.push(...bus.studentsAssigned);
                }
            });
            
            // Count unique students
            const uniqueStudentIds = [...new Set(studentIds)];
            const studentCount = uniqueStudentIds.length;
            
            // Calculate percentage based on total student count
            const totalStudents = await User.countDocuments({ role: 'student' });
            const percentage = totalStudents > 0 
                ? Math.round((studentCount / totalStudents) * 100) 
                : (100 / (routes.length || 1) * (routes.length - index) / 2).toFixed(0);
            
            // If no students are assigned yet, use a default value based on bus count
            const estimatedStudents = studentCount > 0 
                ? studentCount 
                : busesOnRoute.reduce((sum, bus) => sum + (bus.capacity || 30) / 2, 0);
            
            return {
                route: route || `Route ${String.fromCharCode(65 + index)}`,
                students: Math.round(estimatedStudents),
                percentage: `${percentage}%`
            };
        }));
        
        // User engagement by role - calculate based on lastActive timestamps
        const roles = ['student', 'parent', 'driver', 'admin'];
        const userEngagement = [];
        
        // Get date ranges for comparison
        const now = new Date();
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        for (const role of roles) {
            // Count users with this role
            const userCount = await User.countDocuments({ role });
            
            // Count active sessions in the last week (users with lastActive in that period)
            const activeUsers = await User.countDocuments({ 
                role,
                lastActive: { $gte: weekAgo }
            });
            
            // Calculate average session length if we have session data
            let avgSessionMinutes = 0;
            let sessionCount = 0;
            
            try {
                // This assumes you're tracking session data in the database
                // Using the User model with sessionLogs field or a separate Sessions collection
                
                // Try to find session duration data from users with this role
                const usersWithSessions = await User.find({
                    role,
                    sessionLogs: { $exists: true, $ne: [] }
                });
                
                if (usersWithSessions.length > 0) {
                    // Calculate average session time
                    let totalMinutes = 0;
                    
                    for (const user of usersWithSessions) {
                        if (user.sessionLogs && Array.isArray(user.sessionLogs)) {
                            for (const session of user.sessionLogs) {
                                if (session.startTime && session.endTime) {
                                    const durationMinutes = (session.endTime - session.startTime) / (1000 * 60);
                                    totalMinutes += durationMinutes;
                                    sessionCount++;
                                }
                            }
                        }
                    }
                    
                    if (sessionCount > 0) {
                        avgSessionMinutes = totalMinutes / sessionCount;
                    }
                }
            } catch (err) {
                console.error(`Error calculating session duration for ${role}:`, err);
            }
            
            // Use reasonable defaults based on role if no data is available
            if (avgSessionMinutes === 0) {
                // Default values based on typical behavior per role
                if (role === 'student') {
                    avgSessionMinutes = 3.2;
                } else if (role === 'parent') {
                    avgSessionMinutes = 5.7;
                } else if (role === 'driver') {
                    avgSessionMinutes = 18.5;
                } else if (role === 'admin') {
                    avgSessionMinutes = 27.3;
                }
            }
            
            // Calculate change percentage from previous period
            let changeValue = '+0%';
            try {
                // Compare current week with previous week
                const twoWeeksAgo = new Date(weekAgo);
                twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 7);
                
                const prevPeriodActiveUsers = await User.countDocuments({
                    role,
                    lastActive: { $gte: twoWeeksAgo, $lt: weekAgo }
                });
                
                if (prevPeriodActiveUsers > 0) {
                    const changePercent = ((activeUsers - prevPeriodActiveUsers) / prevPeriodActiveUsers) * 100;
                    const sign = changePercent >= 0 ? '+' : '';
                    changeValue = `${sign}${changePercent.toFixed(0)}%`;
                }
            } catch (err) {
                console.error(`Error calculating change for ${role}:`, err);
                
                // Default change values if calculation fails
                if (role === 'student') {
                    changeValue = '+12%';
                } else if (role === 'parent') {
                    changeValue = '+8%';
                } else if (role === 'driver') {
                    changeValue = '+4%';
                } else if (role === 'admin') {
                    changeValue = '-2%';
                }
            }
            
            // Use active users as session count, or a reasonable multiplier if none detected
            const sessions = activeUsers > 0 ? activeUsers : userCount * 5;
            
            userEngagement.push({
                role: role.charAt(0).toUpperCase() + role.slice(1) + 's', // Pluralize
                sessions: sessions,
                avgTime: `${avgSessionMinutes.toFixed(1)} min`,
                change: changeValue
            });
        }
        
        res.json({
            success: true,
            topRoutes,
            userEngagement
        });
    } catch (error) {
        console.error('Error fetching engagement analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch engagement analytics',
            message: error.message
        });
    }
};

// Export analytics report as CSV
export const exportAnalyticsReport = async (req, res) => {
    try {
        const { timeRange = '7d' } = req.query;
        
        // Fetch all the data needed for export
        const busesActive = await Bus.countDocuments({ status: 'active' });
        const busesMaintenance = await Bus.countDocuments({ status: 'maintenance' });
        const busesInactive = await Bus.countDocuments({ status: 'inactive' });
        
        const pendingReports = await Report.countDocuments({ status: 'pending' });
        const reviewingReports = await Report.countDocuments({ status: 'reviewing' });
        const resolvedReports = await Report.countDocuments({ status: 'resolved' });
        const dismissedReports = await Report.countDocuments({ status: 'dismissed' });
        
        const maintenanceReports = await Report.countDocuments({ type: 'maintenance' });
        const emergencyReports = await Report.countDocuments({ type: 'emergency' });
        const complaintReports = await Report.countDocuments({ type: 'complaint' });
        const feedbackReports = await Report.countDocuments({ type: 'feedback' });
        
        // Get usage data similar to getAnalyticsUsage
        // This is simplified - in production you'd reuse logic from getAnalyticsUsage
        const today = new Date();
        const startDate = new Date(today);
        if (timeRange === '7d') startDate.setDate(startDate.getDate() - 7);
        else if (timeRange === '30d') startDate.setDate(startDate.getDate() - 30);
        else if (timeRange === '3m') startDate.setMonth(startDate.getMonth() - 3);
        
        // Build CSV content
        let csvContent = "Bus Tracking Analytics Report\n";
        csvContent += `Generated on: ${new Date().toLocaleString()}\n`;
        csvContent += `Time range: ${timeRange}\n\n`;
        
        csvContent += "BUS STATUS DATA\n";
        csvContent += "Status,Count\n";
        csvContent += `Active,${busesActive}\n`;
        csvContent += `Maintenance,${busesMaintenance}\n`;
        csvContent += `Inactive,${busesInactive}\n\n`;
        
        csvContent += "REPORT STATUS DATA\n";
        csvContent += "Status,Count\n";
        csvContent += `Pending,${pendingReports}\n`;
        csvContent += `Reviewing,${reviewingReports}\n`;
        csvContent += `Resolved,${resolvedReports}\n`;
        csvContent += `Dismissed,${dismissedReports}\n\n`;
        
        csvContent += "REPORT TYPES DATA\n";
        csvContent += "Type,Count\n";
        csvContent += `Maintenance,${maintenanceReports}\n`;
        csvContent += `Emergency,${emergencyReports}\n`;
        csvContent += `Complaint,${complaintReports}\n`;
        csvContent += `Feedback,${feedbackReports}\n`;
        
        // Send CSV response
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=bus-tracking-analytics-${new Date().toISOString().split('T')[0]}.csv`);
        res.status(200).send(csvContent);
        
    } catch (error) {
        console.error('Error exporting analytics report:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to export analytics report',
            message: error.message
        });
    }
};

// --- System Settings Controllers ---

// Get system settings
export const getSystemSettings = async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        // Exclude sensitive fields like encrypted password from the response
        const { smtpPassEncrypted, ...settingsResponse } = settings.toObject();

        res.status(200).json({ 
            success: true, 
            settings: settingsResponse
        });
    } catch (error) {
        console.error('Error fetching system settings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch system settings',
            message: error.message
        });
    }
};

// Update system settings
export const updateSystemSettings = async (req, res) => {
    try {
        const updates = req.body;
        const { smtpPass, ...otherUpdates } = updates; // Separate potential password update

        // If smtpPass is provided and not empty, encrypt it and add to updates
        if (smtpPass && smtpPass.trim() !== '') {
            console.log("Received new SMTP password, hashing...");
            const salt = await bcrypt.genSalt(10);
            otherUpdates.smtpPassEncrypted = await bcrypt.hash(smtpPass, salt);
        } else {
             // If smtpPass is explicitly set to empty or null, consider removing the stored hash
             // (Optional: depends on desired behavior - keep old hash vs clear it)
             // For now, we only update if a NEW password is provided.
             // If you want to clear it, you might do:
             // if (smtpPass === '') {
             //     otherUpdates.smtpPassEncrypted = ''; 
             // }
        }

        // Find the single settings document and update it
        const updatedSettings = await Settings.findOneAndUpdate(
            { singleton: true }, 
            { $set: otherUpdates },
            { new: true, upsert: true, runValidators: true } // upsert ensures creation if it doesn't exist
        );

        if (!updatedSettings) {
             // Should not happen with upsert: true, but good practice to check
            return res.status(404).json({ 
                success: false, 
                error: 'Settings document not found and could not be created.' 
            });
        }
        
        // Exclude sensitive fields from the response
        const { smtpPassEncrypted, ...settingsResponse } = updatedSettings.toObject();

        res.status(200).json({ 
            success: true, 
            message: 'System settings updated successfully.',
            settings: settingsResponse
        });
    } catch (error) {
        console.error('Error updating system settings:', error);
        // Handle potential validation errors
        if (error.name === 'ValidationError') {
             return res.status(400).json({ 
                 success: false,
                 error: 'Validation Error', 
                 message: error.message 
             });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to update system settings',
            message: error.message
        });
    }
};

export const assignStudentsToBus = async (req, res) => {
  try {
    const { id } = req.params;              // bus _id
    const { studentIds } = req.body;        // array of user _ids

    // validate
    if (!Array.isArray(studentIds)) {
      return res.status(400).json({ error: "studentIds must be an array" });
    }

    // ensure all IDs exist and are students
    const validStudents = await User.find({
      _id: { $in: studentIds },
      role: 'student'
    }).select('_id');
    if (validStudents.length !== studentIds.length) {
      return res.status(400).json({ error: "Some IDs are invalid or not students" });
    }

    // update bus
    const bus = await Bus.findById(id);
    if (!bus) return res.status(404).json({ error: "Bus not found" });

    bus.studentsAssigned = studentIds;
    await bus.save();

    // respond with updated bus
    const updated = await Bus.findById(id)
      .populate('studentsAssigned', 'name email');
    res.json({ bus: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not assign students" });
  }
};
 export const getDashboardMetrics = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [activeUsersToday, busesOnRoute, reportsSubmitted, activeReports] = await Promise.all([
      User.countDocuments({ lastLogin: { $gte: today } }),
      Bus.countDocuments({ status: 'active', isOnRoute: true }), // Adjust based on your schema
      Report.countDocuments({
        submittedAt: { $gte: today }
      }),
      Report.countDocuments({ status: { $in: ['pending', 'reviewing'] } })
    ]);

    res.json({
      success: true,
      metrics: {
        users: { activeToday: activeUsersToday },
        buses: { onRoute: busesOnRoute },
        reports: { submittedToday: reportsSubmitted, active: activeReports }
      }
    });
  } catch (error) {
    console.error('Dashboard metric fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard metrics',
      error: error.message
    });
  }
};


export const sendAdminNotification = async (req, res) => {
  try {
    const { title = "", message = "", recipientIds = [], type = "", isUrgent = false } = req.body;

    if (!title.trim() || !type.trim()) {
      return res.status(400).json({ success: false, error: "Title and type are required." });
    }

    const sanitizedType = type.trim().toLowerCase();

    let recipients = recipientIds;

    // If no recipient IDs passed, broadcast to all students
    if (recipients.length === 0) {
      const students = await User.find({ role: "student" }).select("_id");
      recipients = students.map((s) => s._id);
    }

    const notification = await Notification.create({
      senderId: req.user.id,
      recipientIds: recipients,
      type: sanitizedType,
      title: title.trim(),
      message: message.trim(),
      isUrgent,
    });

    // Emit to each student's room via Socket.io
    const io = req.app.get("io");
    if (io) {
      recipients.forEach((studentId) => {
        io.to(`user:${studentId}`).emit("notification:new", {
          id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          isUrgent: notification.isUrgent,
          createdAt: notification.createdAt,
        });
      });
    }

    res.status(201).json({ success: true, notification });
  } catch (err) {
    console.error("sendAdminNotification error:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};
