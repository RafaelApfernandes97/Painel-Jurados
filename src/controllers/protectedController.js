function getProtectedTest(req, res) {
  res.status(200).json({
    message: "acesso permitido"
  });
}

module.exports = {
  getProtectedTest
};
