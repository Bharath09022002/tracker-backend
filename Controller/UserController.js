// import dotenv from 'dotenv';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import User from '../Modules/UserModule.js';
const saltRounds = 10;// dotenv.config();
import  {sendUserMail} from '../SendMail/sendUserMail.js'



const generateReferenceID = async () => {
    const prefix = "ARRA";
    let referenceID;
    let exists = true;

    while (exists) {
        const randomNumber = Math.floor(100000 + Math.random() * 900000); // 6 digits
        referenceID = `${prefix}${randomNumber}`;

        const user = await User.findOne({ RerenceceID: referenceID });
        exists = !!user;
    }

    return referenceID;
};
const generatePassword = (userName, mobileNo) => {
    const namePart = userName
        .replace(/\s+/g, "")
        .substring(0, 4)
        .toLowerCase();

    const mobilePart = mobileNo.toString().slice(-4);

    return `${namePart}${mobilePart}`;
};



export const Register = async (req, res) => {
    try {
        const {
            userName,
            email,
            mobileNo,
            PanCardno,
            AadharCardNo,
            Role
        } = req.body;

        // Check existing user
        const exUser = await User.findOne({
            $or: [{ email }, { mobileNo }]
        });

        if (exUser) {
            return res.status(400).json({
                message: "Email or Mobile already exists"
            });
        }

        // Auto-generate Reference ID
        const RerenceceID = await generateReferenceID();

        // 🔐 Auto-generate password
        const plainPassword = generatePassword(userName, mobileNo);

        // Hash password
        const hash = await bcrypt.hash(plainPassword, 10);


        const register = new User({
            userName,
            RerenceceID,
            email,
            mobileNo,
            password: hash,
            PanCardno,
            AadharCardNo,
            Role: Role || "User"
        });

        const user = await register.save();
        console.log("SMTP USER:", process.env.MAIL_USER);

        await sendUserMail(email, mobileNo, plainPassword);

        res.status(201).json({
            message: "User created successfully",
            RerenceceID,
            id: user._id
        });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};






export const login = async (req, res) => {
    let email = req.body.email
    let foundUser = await User.findOne({ email: email })
    if (foundUser) {
        bcrypt.compare(req.body.password, foundUser.password, (err, result) => {
            if (result) {
                const token = jwt.sign({ id: foundUser?._id }, process.env.JWT)
                res.header("hrms-auth-token", token).json({ message: "login successfully", token: token })
            } else {
                res.status(400).json({ message: "please enter correct password" })
            }
        })
    }else{
        res.status(404).json({ message: "user not found" })
    }
}

// Update the User
export const updateUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.body.id, { $set: req.body }, { new: true })
        res.status(200).json({ meesage: "Updated successfully" })
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export const deleteUser = async (req, res) => {
    let email = req.body.email
    try {
        const user = await User.findOneAndRemove({ email: email });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json({ message: "User deleted success" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const profile = async (req, res) => {
    try {
        const view = await User.findById({ _id: req.user.id }).select("-password")
        res.status(200).json({ data: view })
    } catch (error) {
        res.status(400).json({ message: error.message });
    }

}

export const getAllUser = async (req, res) => {
    try {
        const getUser = await User.find().select("-password")
        res.status(200).json({ data: getUser })
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}
export const getUserById = async (req, res) => {
    try {
        const getUser = await User.findById({ _id: req.params.id }).select("-password")
        res.status(200).json({ data: getUser })
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
        
    }

