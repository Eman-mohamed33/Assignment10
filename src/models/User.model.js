import mongoose, { Types } from "mongoose";
import { type } from "os";
import { ref } from "process";

export let genderEnum = { male: "male", female: "female" };
export let roleEnum = { user: "User", admin: "Admin" };
export let providerEnum = { system: "system", google: "google" };

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        minLength: [2, "The name must be more than or equal to 2 characters"],
        maxLength: [20, "The name must be less than or equal to 20 characters"],
    },
    lastName: {
        type: String,
        required: true,
        minLength: [2, "The name must be more than or equal to 2 characters"],
        maxLength: [20, "The name must be less than or equal to 20 characters"],
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: function () {
            console.log({ DOC: this });
            return this.provider === providerEnum.system ? true : false;
        },
    },
    phone: {
        type: String,
        required: function () {
            return this.provider === providerEnum.system ? true : false;
        },
    },
    gender: {
        type: String,

        enum: { values: Object.values(genderEnum), message: `Gender Only Allow ${Object.values(genderEnum)}` },
        default: genderEnum.male,
        
    },
    role: {
        type: String,

        enum: { values: Object.values(roleEnum), message: `Role Only Allow ${Object.values(roleEnum)}` },
        default: roleEnum.user
        
    },
    provider: {
        type: String,
        enum: Object.values(providerEnum),
        default: providerEnum.system
    },
    confirmEmail: Date,
    confirmEmailOtp: {
        type: String,
        
    },
    forgotPasswordOtp: String,
    picture: String,
    deletedAt: Date,
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    restoredAt: Date,
    restoredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    oldPasswords: [String],
    changeCredentialsTime: Date,

},
    {
        timestamps: true,
        toObject: { virtuals: true },
        toJSON: { virtuals: true },
       
    });
    
userSchema.virtual("fullName").set(function (Value) {
    const [firstName, lastName] = Value?.split(" ") || [];
    this.set({ firstName, lastName });
});

userSchema.virtual("fullName").get(function () {
    return `${this.firstName} ${this.lastName}`;
});

export const UserModel = mongoose.models.User || mongoose.model("User", userSchema);
UserModel.syncIndexes();
    