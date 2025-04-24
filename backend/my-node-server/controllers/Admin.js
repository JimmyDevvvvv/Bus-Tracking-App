export const adminAction = (req, res) => {
    res.json({ message: `Hello, Admin ${req.user.id}! You have access.` });
};
