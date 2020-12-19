import { sequelize } from "../../service/SequelizeService";
import { Model, DataTypes, Optional } from "sequelize";

export interface UserWeChatAttributes {
    id: number;
    user_uuid: string;
    open_uuid: string;
    union_uuid: string;
    created_at: string;
    updated_at: string;
    version: number;
    is_delete: boolean;
}

interface UserWeChatCreationAttributes extends Optional<UserWeChatAttributes, "id"> {}

export const UserWeChatModel = sequelize.define<
    Model<UserWeChatAttributes, UserWeChatCreationAttributes>
>(
    "user_wechat",
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
        open_uuid: {
            type: DataTypes.STRING(40),
            allowNull: false,
            unique: true,
        },
        union_uuid: {
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
