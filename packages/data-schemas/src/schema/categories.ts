import { Schema, Document } from 'mongoose';

// 카테고리(Category) 도큐먼트 타입 정의
export interface ICategory extends Document {
  label: string; // 카테고리 이름(라벨)
  value: string; // 카테고리 값(고유값)
}

// 카테고리(Category) 스키마 정의
const categoriesSchema = new Schema<ICategory>({
  label: {
    type: String,
    required: true, // 필수
    unique: true,   // 중복 불가
  },
  value: {
    type: String,
    required: true, // 필수
    unique: true,   // 중복 불가
  },
});

export default categoriesSchema;
