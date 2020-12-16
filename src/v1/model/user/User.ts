import { sequelize } from "../../service/SequelizeService";
import { DataTypes, Model, Optional } from "sequelize";

export interface UserAttributes {
    id: number;
    user_id: string;
    name: string;
    avatar_url: string;
    phone: string;
    password: string;
    sex: 1 | 2;
    last_login_platform: string;
    created_at: string;
    updated_at: string;
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
        user_id: {
            type: DataTypes.STRING(40),
            allowNull: false,
            unique: true,
        },
        name: {
            type: DataTypes.STRING(50),
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
        password: {
            type: DataTypes.STRING(32),
            allowNull: false,
        },
        sex: {
            type: DataTypes.CHAR(1),
            allowNull: false,
            set(value: number): void {
                // @ts-ignore
                this.setDataValue("sex", String(value));
            },
            get(): number {
                const rawValue = this.getDataValue("sex");
                return Number(rawValue);
            },
        },
        last_login_platform: {
            type: DataTypes.STRING(40),
            allowNull: false,
        },
        created_at: {
            type: DataTypes.TIME,
            allowNull: false,
        },
        updated_at: {
            type: DataTypes.TIME,
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
