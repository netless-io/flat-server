import { sequelize } from "../../service/SequelizeService";
import { Model, DataTypes, Optional } from "sequelize";

export interface UserWeChatAttributes {
    id: number;
    user_id: string;
    open_id: string;
    union_id: string;
    created_at: string;
    updated_at: string;
}

interface UserWeChatCreationAttributes extends Optional<UserWeChatAttributes, "id"> {}

export const UserWeChatModel = sequelize.define<
    Model<UserWeChatAttributes, UserWeChatCreationAttributes>
>(
    "users_wechat",
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
        open_id: {
            type: DataTypes.STRING(40),
            allowNull: false,
            unique: true,
        },
        union_id: {
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
