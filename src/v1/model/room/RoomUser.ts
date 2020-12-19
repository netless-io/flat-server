import { sequelize } from "../../service/SequelizeService";
import { DataTypes, Model, Optional } from "sequelize";
import { MySQLBaseField } from "../types";

export interface RoomUserAttributes {
    room_uuid: string;
    user_uuid: string;
    created_at: string;
    updated_at: string;
    version: number;
    is_delete: boolean;
}

interface RoomUserField extends RoomUserAttributes, MySQLBaseField {}

interface RoomUserCreationAttributes extends Optional<RoomUserField, "id"> {}

export const RoomUserModel = sequelize.define<Model<RoomUserField, RoomUserCreationAttributes>>(
    "room_users",
    {
        id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        room_uuid: {
            type: DataTypes.STRING(40),
            allowNull: false,
        },
        user_uuid: {
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
