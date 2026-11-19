import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Song } from "../models/song.models.js";
import { User } from "../models/user.models.js";
import { resolveUserPlan } from "../config/plans.js";

const JWT_SECRET = process.env.JWT_SECRET || "beat_music_super_secure_jwt_secret_key_2026_spotify_clone";

const NAME_PATTERN = /^[\p{L}][\p{L}\p{M} .'-]*$/u;
const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const getNameError = (value) => {
    const name = String(value ?? "").trim();

    if (!name) return "Please enter your full name";
    if (name.length < 2) return "Name must be at least 2 characters";
    if (name.length > 50) return "Name must be 50 characters or fewer";
    if (!NAME_PATTERN.test(name)) {
        return "Name can only contain letters, spaces, apostrophes, periods, and hyphens";
    }
    return null;
};

const getEmailError = (value) => {
    const rawEmail = String(value ?? "");
    const email = rawEmail.trim().toLowerCase();

    if (!email) return "Please enter your email address";
    if (email.length > 254) return "Email must be 254 characters or fewer";
    if (/\s/.test(email)) return "Email cannot contain spaces";
    if (!EMAIL_PATTERN.test(email)) return "Please provide a valid email address";

    const [localPart, domain] = email.split("@");
    if (localPart.length > 64) return "The part before @ must be 64 characters or fewer";
    if (localPart.startsWith(".") || localPart.endsWith(".") || localPart.includes("..")) {
        return "Please provide a valid email address";
    }
    if (domain.includes("..")) return "Please provide a valid email address";
    if (domain.split(".").some((part) => !part || part.startsWith("-") || part.endsWith("-"))) {
        return "Please provide a valid email address";
    }
    return null;
};

const getPasswordError = (value) => {
    if (typeof value !== "string" || !value) return "Please create a password";
    if (value.length < 8) return "Password must be at least 8 characters long";
    if (value.length > 64) return "Password must be 64 characters or fewer";
    if (/\s/.test(value)) return "Password cannot contain spaces";
    if (!/[A-Z]/.test(value)) return "Password must include at least one uppercase letter";
    if (!/[a-z]/.test(value)) return "Password must include at least one lowercase letter";
    if (!/[0-9]/.test(value)) return "Password must include at least one number";
    if (!/[^A-Za-z0-9\s]/.test(value)) return "Password must include at least one special character";
    return null;
};

const generateToken = (userId, role) => {
    return jwt.sign({ id: userId, sub: userId, role }, JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });
};

const safeUser = (user) => {
    const adminEmails = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
    const email = user.email?.trim().toLowerCase();
    const isAdmin = user.role === "admin" || (email && adminEmails.includes(email));

    return {
        _id: user._id,
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        imageUrl: user.imageUrl || "",
        role: isAdmin ? "admin" : (user.role || "user"),
        isAdmin: Boolean(isAdmin),
        plan: resolveUserPlan(user),
        planBillingCycle: user.planBillingCycle || "monthly",
        planExpiresAt: user.planExpiresAt || null,
        createdAt: user.createdAt,
    };
};

export const register = async (req, res, next) => {
    try {
        const { name, email, password, confirmPassword } = req.body || {};

        const nameError = getNameError(name);
        if (nameError) {
            return res.status(400).json({ message: nameError });
        }

        const emailError = getEmailError(email);
        if (emailError) {
            return res.status(400).json({ message: emailError });
        }

        const passwordError = getPasswordError(password);
        if (passwordError) {
            return res.status(400).json({ message: passwordError });
        }

        if (!confirmPassword) {
            return res.status(400).json({ message: "Please re-enter your password" });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        const trimmedName = String(name).trim();
        const trimmedEmail = String(email).trim().toLowerCase();

        const existingUser = await User.findOne({ email: trimmedEmail });
        if (existingUser) {
            return res.status(409).json({ message: "An account with this email already exists" });
        }

        const adminEmails = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "")
            .split(",")
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean);
        const role = adminEmails.includes(trimmedEmail) ? "admin" : "user";

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            fullName: trimmedName,
            email: trimmedEmail,
            password: hashedPassword,
            role,
        });

        const token = generateToken(user._id, role);

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(201).json({
            success: true,
            message: "Account created successfully",
            user: safeUser(user),
            token,
        });
    } catch (error) {
        console.error("Error in register:", error);
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const emailError = getEmailError(email);
        if (emailError) {
            return res.status(400).json({ message: emailError });
        }

        const trimmedEmail = String(email).trim().toLowerCase();
        const user = await User.findOne({ email: trimmedEmail }).select("+password");

        if (!user || !user.password) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const adminEmails = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "")
            .split(",")
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean);
        if (adminEmails.includes(trimmedEmail) && user.role !== "admin") {
            user.role = "admin";
            await user.save();
        }

        const token = generateToken(user._id, user.role);

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            success: true,
            message: "Logged in successfully",
            user: safeUser(user),
            token,
        });
    } catch (error) {
        console.error("Error in login:", error);
        next(error);
    }
};

export const logout = async (req, res, next) => {
    try {
        res.clearCookie("token");
        res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        next(error);
    }
};

export const getMe = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        res.status(200).json({ success: true, user: safeUser(req.user) });
    } catch (error) {
        next(error);
    }
};

export const authCallback = async (req, res, next)=>{
    try {
        const { id, firstName, lastName, imageUrl, email } = req.body;
        const fullName = `${firstName ?? ""} ${lastName ?? ""}`.trim() || "User";

        const existing = await User.findOne({ clerkId: id });
        if (!existing) {
            await User.create({
                clerkId: id,
                fullName,
                imageUrl,
                email: email ? String(email).trim().toLowerCase() : `clerk_${id}@unknown.local`,
            });
        } else {
            const update = {};
            if (!existing.imageUrl && imageUrl) update.imageUrl = imageUrl;
            if (!existing.fullName && fullName) update.fullName = fullName;
            if (email && (!existing.email || existing.email.endsWith("@unknown.local"))) {
                update.email = String(email).trim().toLowerCase();
            }
            if (Object.keys(update).length > 0) {
                await User.updateOne({ clerkId: id }, { $set: update });
            }
        }

        res.status(200).json ({
            success : true
        })
    } catch (error) {
        console.log("Error in auth ", error);
        next(error)
    }
}

export const getFearuresSogs = async (req, res, next)=>{
    try {
        // 6 song fetch 
        const songs = await Song.aggregate([
            {
                $sample : { size : 6}
            },
            {
                $project: {
                    _id : 1,
                    title: 1,
                    artist : 1,
                    imageUrl : 1,
                    audioUrl : 1,
                }
            }
        ])
        res.json(songs)

    } catch (error) {
        next(error)
    }
}
export const getMadeForYou = async (req, res, next)=>{
    try {
        const songs = await Song.aggregate([
            {
                $sample : { size : 4}
            },
            {
                $project: {
                    _id : 1,
                    title: 1,
                    artist : 1,
                    imageUrl : 1,
                    audioUrl : 1,
                }
            }
        ])
        res.json(songs)

    } catch (error) {
        next(error)
    }
}
export const getTrending = async (req, res, next)=>{
    try {
        const songs = await Song.aggregate([
            {
                $sample : { size : 4}
            },
            {
                $project: {
                    _id : 1,
                    title: 1,
                    artist : 1,
                    imageUrl : 1,
                    audioUrl : 1,
                }
            }
        ])
        res.json(songs)

    } catch (error) {
        next(error)
    }
}
