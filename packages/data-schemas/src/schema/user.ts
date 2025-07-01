import { Schema, Document } from 'mongoose';
import { SystemRoles } from 'cbwchat-data-provider';

// 사용자 인터페이스 정의
export interface IUser extends Document {
  name?: string;
  username?: string;
  email: string;
  emailVerified: boolean;
  password?: string;
  avatar?: string;
  provider: string;
  role?: string;
  googleId?: string;
  facebookId?: string;
  openidId?: string;
  samlId?: string;
  ldapId?: string;
  githubId?: string;
  discordId?: string;
  appleId?: string;
  plugins?: unknown[];
  twoFactorEnabled?: boolean;
  totpSecret?: string;
  backupCodes?: Array<{
    codeHash: string;
    used: boolean;
    usedAt?: Date | null;
  }>;
  refreshToken?: Array<{
    refreshToken: string;
  }>;
  expiresAt?: Date;
  termsAccepted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// 세션 서브 스키마 (_id 없이)
const SessionSchema = new Schema(
  {
    refreshToken: {
      type: String,
      default: '',
    },
  },
  { _id: false }, // _id 필드 생성 안 함
);

// 백업 코드 서브 스키마 (_id 없이)
const BackupCodeSchema = new Schema(
  {
    codeHash: { type: String, required: true },
    used: { type: Boolean, default: false },
    usedAt: { type: Date, default: null },
  },
  { _id: false }, // _id 필드 생성 안 함
);

// 사용자 메인 스키마
const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
    },
    username: {
      type: String,
      lowercase: true,
      default: '',
    },
    email: {
      type: String,
      required: [true, "can't be blank"],
      lowercase: true,
      unique: true,
      match: [/\S+@\S+\.\S+/, 'is invalid'],
      index: true,
    },
    emailVerified: {
      type: Boolean,
      required: true,
      default: false,
    },
    password: {
      type: String,
      trim: true,
      minlength: 8,
      maxlength: 128,
    },
    avatar: {
      type: String,
      required: false,
    },
    provider: {
      type: String,
      required: true,
      default: 'local',
    },
    role: {
      type: String,
      default: SystemRoles.USER,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    facebookId: {
      type: String,
      unique: true,
      sparse: true,
    },
    openidId: {
      type: String,
      unique: true,
      sparse: true,
    },
    samlId: {
      type: String,
      unique: true,
      sparse: true,
    },
    ldapId: {
      type: String,
      unique: true,
      sparse: true,
    },
    githubId: {
      type: String,
      unique: true,
      sparse: true,
    },
    discordId: {
      type: String,
      unique: true,
      sparse: true,
    },
    appleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    plugins: {
      type: Array,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    totpSecret: {
      type: String,
    },
    backupCodes: {
      type: [BackupCodeSchema], // 백업 코드 배열
    },
    refreshToken: {
      type: [SessionSchema], // 세션 배열
    },
    expiresAt: {
      type: Date,
      expires: 604800, // 7일(초 단위) 후 만료
    },
    termsAccepted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }, // createdAt, updatedAt 자동 생성
);

export default UserSchema;