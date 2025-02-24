export const studentAction = (req, res) => {
    res.json({ message: `Hello, Student ${req.user.id}! You have access.` });
};
