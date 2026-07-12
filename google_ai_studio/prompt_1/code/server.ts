import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { User, Task, AdminStats, UserRole, UserStatus, TaskPriority, TaskStatus } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "gestor-de-tareas-super-secreto-2026";

// Ensure data and uploads directories exist
const DATA_DIR = path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const DB_FILE = path.join(DATA_DIR, "db.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Initialize empty DB if not present
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], tasks: [], passwordRecoveries: [] }, null, 2));
}

// Helper to read/write DB
function readDB() {
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading database file, returning default structure.", err);
    return { users: [], tasks: [], passwordRecoveries: [] };
  }
}

function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing database file.", err);
  }
}

// Middleware
app.use(express.json());
app.use("/uploads", express.static(UPLOADS_DIR));

// Configure Multer for File Uploads (max 5MB, PDF or images)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Formato de archivo inválido. Solo se admiten PDFs e imágenes (JPEG, PNG, GIF)."));
    }
  }
});

// Extend Express Request type
interface AuthRequest extends Request {
  user?: User;
}

// Authentication Middleware
function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Acceso denegado. Token no proporcionado." });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      res.status(403).json({ error: "Token inválido o expirado." });
      return;
    }

    const db = readDB();
    const user = db.users.find((u: any) => u.id === decoded.id);

    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado en la base de datos." });
      return;
    }

    if (user.status === "inactive") {
      res.status(403).json({ error: "Este usuario ha sido desactivado por el administrador." });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt
    };
    next();
  });
}

// Admin Check Middleware
function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ error: "Acceso denegado. Se requieren permisos de administrador." });
    return;
  }
  next();
}

/* ================= AUTHENTICATION ROUTES ================= */

// Register Route
app.post("/api/auth/register", (req: Request, res: Response): void => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "El email y la contraseña son obligatorios." });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: "Formato de email inválido." });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres." });
      return;
    }

    const db = readDB();
    const existingUser = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      res.status(400).json({ error: "Este email ya está registrado." });
      return;
    }

    // First user is Admin, rest are normal users
    const isFirstUser = db.users.length === 0;
    const role: UserRole = isFirstUser ? "admin" : "user";
    const status: UserStatus = "active";

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = {
      id: "u-" + Date.now() + "-" + Math.round(Math.random() * 1000),
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      status,
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    writeDB(db);

    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, {
      expiresIn: "24h"
    });

    const userResponse: User = {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
      createdAt: newUser.createdAt
    };

    res.status(201).json({
      user: userResponse,
      token,
      message: isFirstUser 
        ? "Registro exitoso. Eres el primer usuario, por lo que has sido asignado como Administrador automáticamente."
        : "Registro completado con éxito."
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Error interno del servidor al registrar el usuario." });
  }
});

// Login Route
app.post("/api/auth/login", (req: Request, res: Response): void => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "El email y la contraseña son obligatorios." });
      return;
    }

    const db = readDB();
    const user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      res.status(401).json({ error: "Credenciales incorrectas." });
      return;
    }

    if (user.status === "inactive") {
      res.status(403).json({ error: "Tu cuenta ha sido desactivada por un administrador." });
      return;
    }

    const passwordMatch = bcrypt.compareSync(password, user.password);
    if (!passwordMatch) {
      res.status(401).json({ error: "Credenciales incorrectas." });
      return;
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: "24h"
    });

    const userResponse: User = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt
    };

    res.json({
      user: userResponse,
      token,
      message: "Sesión iniciada con éxito."
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Error interno del servidor al iniciar sesión." });
  }
});

// Password Recovery Request
app.post("/api/auth/recover-password", (req: Request, res: Response): void => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: "El email es obligatorio." });
      return;
    }

    const db = readDB();
    const user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Security practice: Don't explicitly reveal if email exists, but here we can return success
      // while also simulating a recovery code inside db for easy testing in UI.
      res.status(200).json({
        message: "Si el correo está registrado, recibirás las instrucciones para recuperar tu contraseña."
      });
      return;
    }

    // Generate a temporary 6-digit verification code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 15 * 60 * 1000; // 15 mins

    // Remove older recovery requests for this user
    db.passwordRecoveries = (db.passwordRecoveries || []).filter((r: any) => r.email !== email.toLowerCase());
    db.passwordRecoveries.push({
      email: email.toLowerCase(),
      code: resetCode,
      expiry
    });
    writeDB(db);

    // Provide the recovery code in the API response ONLY FOR DEVELOPMENT testing/simulation in frontend,
    // so the user can easily copy and complete the flow without a real SMTP mailer setup.
    res.status(200).json({
      message: "Instrucciones de recuperación de contraseña preparadas.",
      simulatedMail: {
        to: email,
        subject: "Recuperación de contraseña",
        body: `Usa el siguiente código de restablecimiento: ${resetCode} (Válido por 15 minutos).`
      },
      resetCode // We return this so the front-end can display a helper mock mail client or autofill it
    });
  } catch (error) {
    console.error("Password recovery error:", error);
    res.status(500).json({ error: "Error interno del servidor al procesar la solicitud." });
  }
});

// Reset Password with Code Route
app.post("/api/auth/reset-password", (req: Request, res: Response): void => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      res.status(400).json({ error: "Todos los campos (email, código, nueva contraseña) son obligatorios." });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: "La nueva contraseña debe tener al menos 6 caracteres." });
      return;
    }

    const db = readDB();
    const recovery = (db.passwordRecoveries || []).find(
      (r: any) => r.email === email.toLowerCase() && r.code === code
    );

    if (!recovery) {
      res.status(400).json({ error: "Código de recuperación inválido o vencido." });
      return;
    }

    if (Date.now() > recovery.expiry) {
      res.status(400).json({ error: "El código de recuperación ha expirado." });
      return;
    }

    const userIndex = db.users.findIndex((u: any) => u.email === email.toLowerCase());
    if (userIndex === -1) {
      res.status(404).json({ error: "Usuario no encontrado." });
      return;
    }

    // Update password
    db.users[userIndex].password = bcrypt.hashSync(newPassword, 10);
    // Clean recovery record
    db.passwordRecoveries = db.passwordRecoveries.filter((r: any) => r.email !== email.toLowerCase());
    writeDB(db);

    res.json({ message: "Contraseña restablecida con éxito. Ya puedes iniciar sesión con tu nueva contraseña." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Error interno al restablecer la contraseña." });
  }
});


/* ================= TASK MANAGEMENT ROUTES ================= */

// Get Tasks (with filtering and search)
app.get("/api/tasks", authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!;
    const db = readDB();
    
    let userTasks: Task[] = [];
    if (user.role === "admin") {
      // Admins see all tasks
      userTasks = db.tasks;
    } else {
      // Normal users only see their own tasks
      userTasks = db.tasks.filter((t: any) => t.userId === user.id);
    }

    // Apply filters
    const { status, priority, search } = req.query;

    if (status && typeof status === "string" && status !== "") {
      userTasks = userTasks.filter((t) => t.status === status);
    }

    if (priority && typeof priority === "string" && priority !== "") {
      userTasks = userTasks.filter((t) => t.priority === priority);
    }

    if (search && typeof search === "string" && search !== "") {
      const q = search.toLowerCase();
      userTasks = userTasks.filter(
        (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      );
    }

    // Sort by creation date descending
    userTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(userTasks);
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({ error: "Error al recuperar las tareas." });
  }
});

// Create Task with optional file upload (image or PDF, max 5MB)
app.post("/api/tasks", authenticateToken, (req: AuthRequest, res: Response, next: NextFunction): void => {
  // Wrap in upload.single('file') to process file
  upload.single("file")(req, res, (err) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }

    try {
      const user = req.user!;
      const { title, description, dueDate, priority, status } = req.body;

      if (!title || !priority || !status) {
        res.status(400).json({ error: "El título, la prioridad y el estado son obligatorios." });
        return;
      }

      const db = readDB();
      const newTask: Task = {
        id: "t-" + Date.now() + "-" + Math.round(Math.random() * 1000),
        title,
        description: description || "",
        createdAt: new Date().toISOString(),
        dueDate: dueDate || "",
        priority: priority as TaskPriority,
        status: status as TaskStatus,
        userId: user.id,
        userEmail: user.email
      };

      if (req.file) {
        newTask.fileUrl = `/uploads/${req.file.filename}`;
        newTask.fileName = req.file.originalname;
        newTask.fileSize = req.file.size;
      }

      db.tasks.push(newTask);
      writeDB(db);

      res.status(201).json({
        task: newTask,
        message: "Tarea creada correctamente."
      });
    } catch (error) {
      console.error("Create task error:", error);
      res.status(500).json({ error: "Error al crear la tarea." });
    }
  });
});

// Update Task
app.put("/api/tasks/:id", authenticateToken, (req: AuthRequest, res: Response): void => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }

    try {
      const user = req.user!;
      const taskId = req.params.id;
      const { title, description, dueDate, priority, status, removeFile } = req.body;

      const db = readDB();
      const taskIndex = db.tasks.findIndex((t: any) => t.id === taskId);

      if (taskIndex === -1) {
        res.status(404).json({ error: "Tarea no encontrada." });
        return;
      }

      const existingTask = db.tasks[taskIndex];

      // Check ownership or admin
      if (user.role !== "admin" && existingTask.userId !== user.id) {
        res.status(403).json({ error: "Acceso denegado. No eres el propietario de esta tarea." });
        return;
      }

      // Update fields
      existingTask.title = title !== undefined ? title : existingTask.title;
      existingTask.description = description !== undefined ? description : existingTask.description;
      existingTask.dueDate = dueDate !== undefined ? dueDate : existingTask.dueDate;
      existingTask.priority = priority !== undefined ? (priority as TaskPriority) : existingTask.priority;
      existingTask.status = status !== undefined ? (status as TaskStatus) : existingTask.status;

      // Handle file updates
      if (removeFile === "true" || removeFile === true) {
        if (existingTask.fileUrl) {
          const oldFilePath = path.join(process.cwd(), existingTask.fileUrl);
          if (fs.existsSync(oldFilePath)) {
            try {
              fs.unlinkSync(oldFilePath);
            } catch (e) {
              console.error("Error removing old file", e);
            }
          }
          delete existingTask.fileUrl;
          delete existingTask.fileName;
          delete existingTask.fileSize;
        }
      }

      if (req.file) {
        // Delete old file if present
        if (existingTask.fileUrl) {
          const oldFilePath = path.join(process.cwd(), existingTask.fileUrl);
          if (fs.existsSync(oldFilePath)) {
            try {
              fs.unlinkSync(oldFilePath);
            } catch (e) {
              console.error("Error removing old file on replace", e);
            }
          }
        }
        existingTask.fileUrl = `/uploads/${req.file.filename}`;
        existingTask.fileName = req.file.originalname;
        existingTask.fileSize = req.file.size;
      }

      db.tasks[taskIndex] = existingTask;
      writeDB(db);

      res.json({
        task: existingTask,
        message: "Tarea actualizada correctamente."
      });
    } catch (error) {
      console.error("Update task error:", error);
      res.status(500).json({ error: "Error al actualizar la tarea." });
    }
  });
});

// Delete Task
app.delete("/api/tasks/:id", authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!;
    const taskId = req.params.id;

    const db = readDB();
    const taskIndex = db.tasks.findIndex((t: any) => t.id === taskId);

    if (taskIndex === -1) {
      res.status(404).json({ error: "Tarea no encontrada." });
      return;
    }

    const task = db.tasks[taskIndex];

    // Check authorization
    if (user.role !== "admin" && task.userId !== user.id) {
      res.status(403).json({ error: "Acceso denegado. No eres el propietario de esta tarea." });
      return;
    }

    // Delete associated physical file
    if (task.fileUrl) {
      const filePath = path.join(process.cwd(), task.fileUrl);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.error("Error deleting physical file:", e);
        }
      }
    }

    db.tasks.splice(taskIndex, 1);
    writeDB(db);

    res.json({ success: true, message: "Tarea eliminada correctamente." });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({ error: "Error al eliminar la tarea." });
  }
});


/* ================= ADMIN USER MANAGEMENT ROUTES ================= */

// Get all users (Admin only)
app.get("/api/users", authenticateToken, requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const db = readDB();
    const usersResponse: User[] = db.users.map((u: any) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt
    }));

    res.json(usersResponse);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Error al obtener la lista de usuarios." });
  }
});

// Change user role (Admin only)
app.patch("/api/users/:id/role", authenticateToken, requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const adminUser = req.user!;
    const userIdToChange = req.params.id;
    const { role } = req.body;

    if (role !== "admin" && role !== "user") {
      res.status(400).json({ error: "Rol inválido. Debe ser 'admin' o 'user'." });
      return;
    }

    const db = readDB();
    const userIndex = db.users.findIndex((u: any) => u.id === userIdToChange);

    if (userIndex === -1) {
      res.status(404).json({ error: "Usuario no encontrado." });
      return;
    }

    // Prevent changing own role if they are the only admin
    if (userIdToChange === adminUser.id && role === "user") {
      const otherAdmins = db.users.filter((u: any) => u.role === "admin" && u.id !== adminUser.id);
      if (otherAdmins.length === 0) {
        res.status(400).json({ error: "No puedes quitarte el rol de administrador porque eres el único administrador del sistema." });
        return;
      }
    }

    db.users[userIndex].role = role;
    writeDB(db);

    res.json({
      message: "Rol de usuario actualizado con éxito.",
      user: {
        id: db.users[userIndex].id,
        email: db.users[userIndex].email,
        role: db.users[userIndex].role,
        status: db.users[userIndex].status,
        createdAt: db.users[userIndex].createdAt
      }
    });
  } catch (error) {
    console.error("Change user role error:", error);
    res.status(500).json({ error: "Error interno al actualizar el rol de usuario." });
  }
});

// Activate or Deactivate user (Admin only)
app.patch("/api/users/:id/status", authenticateToken, requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const adminUser = req.user!;
    const userIdToChange = req.params.id;
    const { status } = req.body;

    if (status !== "active" && status !== "inactive") {
      res.status(400).json({ error: "Estado inválido. Debe ser 'active' o 'inactive'." });
      return;
    }

    if (userIdToChange === adminUser.id) {
      res.status(400).json({ error: "No puedes desactivar tu propia cuenta de administrador." });
      return;
    }

    const db = readDB();
    const userIndex = db.users.findIndex((u: any) => u.id === userIdToChange);

    if (userIndex === -1) {
      res.status(404).json({ error: "Usuario no encontrado." });
      return;
    }

    db.users[userIndex].status = status;
    writeDB(db);

    res.json({
      message: `El usuario ha sido ${status === "active" ? "activado" : "desactivado"} con éxito.`,
      user: {
        id: db.users[userIndex].id,
        email: db.users[userIndex].email,
        role: db.users[userIndex].role,
        status: db.users[userIndex].status,
        createdAt: db.users[userIndex].createdAt
      }
    });
  } catch (error) {
    console.error("Toggle user status error:", error);
    res.status(500).json({ error: "Error interno al cambiar el estado del usuario." });
  }
});

// Admin Stats Route (Admin only)
app.get("/api/stats", authenticateToken, requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const db = readDB();
    
    const tasksByStatus = {
      pendiente: 0,
      enCurso: 0,
      completada: 0
    };

    const tasksByPriority = {
      baja: 0,
      media: 0,
      alta: 0
    };

    // Calculate tasks metrics
    db.tasks.forEach((t: Task) => {
      if (t.status === "pendiente") tasksByStatus.pendiente++;
      else if (t.status === "en curso") tasksByStatus.enCurso++;
      else if (t.status === "completada") tasksByStatus.completada++;

      if (t.priority === "baja") tasksByPriority.baja++;
      else if (t.priority === "media") tasksByPriority.media++;
      else if (t.priority === "alta") tasksByPriority.alta++;
    });

    // Calculate active users
    // Map of user ID to number of tasks
    const taskCountMap: { [userId: string]: number } = {};
    db.tasks.forEach((t: Task) => {
      taskCountMap[t.userId] = (taskCountMap[t.userId] || 0) + 1;
    });

    const activeUsers = db.users.map((u: any) => ({
      userId: u.id,
      email: u.email,
      taskCount: taskCountMap[u.id] || 0,
      role: u.role
    }));

    // Sort active users by taskCount descending
    activeUsers.sort((a: any, b: any) => b.taskCount - a.taskCount);

    const stats: AdminStats = {
      totalTasks: db.tasks.length,
      tasksByStatus,
      tasksByPriority,
      activeUsers
    };

    res.json(stats);
  } catch (error) {
    console.error("Get statistics error:", error);
    res.status(500).json({ error: "Error al calcular las estadísticas de administración." });
  }
});


/* ================= VITE DEV SERVER AND PRODUCTION SERVING ================= */

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    
    // Serve through Vite's dev server middleware
    app.use(vite.middlewares);
    
    console.log("Vite development middleware integrated.");
  } else {
    // Production Mode: Serve static build artifacts
    const distPath = path.join(process.cwd(), "dist");
    
    app.use(express.static(distPath));
    
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    
    console.log("Production static server configured.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
