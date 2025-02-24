export const driverAction = (req, res) => {
    res.json({ message: `Hello, Driver ${req.user.id}! You have access.` });
};
