import { sequelize } from "../../service/SequelizeService";
import { DataTypes, Model, Optional } from "sequelize";
import { RoomStatus, RoomType } from "../../controller/room/Constants";
import { MySQLBaseField } from "../types";

export interface RoomAttributes {
    room_uuid: string;
    creator_user_uuid: string;
    cyclical_uuid: string;
    title: string;
    room_type: RoomType;
    room_status: RoomStatus;
    begin_time: number;
    end_time: number;
    created_at: string;
    updated_at: string;
    version: number;
    is_delete: boolean;
}

interface RoomField extends RoomAttributes, MySQLBaseField {}

interface RoomCreationAttributes extends Optional<RoomField, "id"> {}

export const RoomModel = sequelize.define<Model<RoomField, RoomCreationAttributes>>(
    "rooms",
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
            unique: true,
        },
        cyclical_uuid: {
            type: DataTypes.STRING(40),
            allowNull: false,
        },
        creator_user_uuid: {
            type: DataTypes.STRING(40),
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING(150),
            allowNull: false,
        },
        room_type: {
            type: DataTypes.TINYINT,
            allowNull: false,
        },
        room_status: {
            type: DataTypes.ENUM("Pending", "Running", "Stopped"),
            allowNull: false,
        },
        begin_time: {
            type: DataTypes.DATE(3),
            allowNull: false,
        },
        end_time: {
            type: DataTypes.DATE(3),
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
