import { sequelize } from "../../service/SequelizeService";
import { DataTypes, Model, Optional } from "sequelize";

export interface UserAttributes {
    id: number;
    user_uuid: string;
    user_name: string;
    user_password: string;
    avatar_url: string;
    phone: string;
    sex: number;
    last_login_platform: string;
    created_at: string;
    updated_at: string;
    version: number;
    is_delete: boolean;
}

interface UserCreationAttributes extends Optional<UserAttributes, "id"> {}

export const UserModel = sequelize.define<Model<UserAttributes, UserCreationAttributes>>(
    "users",
    {
        id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        user_uuid: {
            type: DataTypes.STRING(40),
            allowNull: false,
            unique: true,
        },
        user_name: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        user_password: {
            type: DataTypes.STRING(32),
            allowNull: false,
        },
        avatar_url: {
            type: DataTypes.STRING(2083),
            allowNull: false,
        },
        phone: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        sex: {
            type: DataTypes.TINYINT,
            allowNull: false,
        },
        last_login_platform: {
            type: DataTypes.STRING(40),
            allowNull: false,
        },
        created_at: {
            type: DataTypes.DATE(3),
            allowNull: false,
        },
        updated_at: {
            type: DataTypes.DATE(3),
            allowNull: false,
        },
        version: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        is_delete: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
    },
    {
        freezeTableName: true,
        timestamps: false,
        createdAt: false,
        updatedAt: false,
    },
);
