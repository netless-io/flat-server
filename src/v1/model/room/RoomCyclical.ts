import { sequelize } from "../../service/SequelizeService";
import { DataTypes, Model, Optional } from "sequelize";
import { MySQLBaseField } from "../types";

export interface RoomCyclicalAttributes {
    cyclical_uuid: string;
    creator_user_uuid: string;
    rate: number;
    end_time: string;
    created_at: string;
    updated_at: string;
    version: number;
    is_delete: boolean;
}

interface RoomCyclicalField extends RoomCyclicalAttributes, MySQLBaseField {}

interface RoomCyclicalCreationAttributes extends Optional<RoomCyclicalField, "id"> {}

export const RoomCyclicalModel = sequelize.define<
    Model<RoomCyclicalField, RoomCyclicalCreationAttributes>
>(
    "room_cyclical",
    {
        id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        cyclical_uuid: {
            type: DataTypes.STRING(40),
            allowNull: false,
        },
        creator_user_uuid: {
            type: DataTypes.STRING(40),
            allowNull: false,
        },
        rate: {
            type: DataTypes.TINYINT,
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
