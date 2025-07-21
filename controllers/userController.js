// controllers/userController.js
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Función para generar el token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// POST /api/user/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    console.log("📩 Datos recibidos en el registro:", req.body); // Log para depuración

    // Validar campos obligatorios
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Email no válido' });
    }

    // Verificar si ya existe un usuario con ese correo
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya existe con ese correo' });
    }

    // Crear el nuevo usuario
    const newUser = await User.create({ name, email, password });

    return res.status(201).json({
      message: 'Usuario registrado con éxito',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      },
      token: generateToken(newUser._id)
    });
  } catch (error) {
    console.error('❌ Error al registrar usuario:', error);
    return res.status(500).json({ message: 'Error interno al registrar usuario', error: error.message });
  }
};

// POST /api/user/login
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    return res.status(200).json({
      message: 'Login exitoso',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      token: generateToken(user._id)
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al iniciar sesión', error: error.message });
  }
};

// GET /api/user/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Error al recuperar perfil', error: error.message });
  }
};

// PUT /api/user/update
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const { name, email, password } = req.body;

    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = password;

    const updatedUser = await user.save();

    return res.status(200).json({
      message: 'Usuario actualizado',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al actualizar usuario', error: error.message });
  }
};

// DELETE /api/user/delete
const deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.user.id);
    if (!deletedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    return res.status(200).json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    return res.status(500).json({ message: 'Error al eliminar usuario', error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  updateUser,
  deleteUser
};
