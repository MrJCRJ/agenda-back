"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AppointmentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentService = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const mongoose = __importStar(require("mongoose"));
const appointment_schema_1 = require("../schemas/appointment.schema");
const common_1 = require("@nestjs/common");
let AppointmentService = AppointmentService_1 = class AppointmentService {
    constructor(appointmentModel) {
        this.appointmentModel = appointmentModel;
        this.logger = new common_1.Logger(AppointmentService_1.name);
    }
    async create(createAppointmentDto) {
        const createdAppointment = new this.appointmentModel(createAppointmentDto);
        return createdAppointment.save();
    }
    async findAll() {
        const appointments = await this.appointmentModel.find().exec();
        return appointments.map((appointment) => {
            const startDate = new Date(appointment.start);
            const endDate = new Date(appointment.end);
            const duration = this.calculateDuration(startDate, endDate);
            return Object.assign(Object.assign({}, appointment.toObject()), { duration });
        });
    }
    async findAllGroupedByTitle(startDateFilter, endDateFilter) {
        try {
            const filter = {};
            if (startDateFilter) {
                filter.start = { $gte: startDateFilter };
            }
            if (endDateFilter) {
                filter.end = { $lte: endDateFilter };
            }
            const appointments = await this.appointmentModel.find(filter).exec();
            if (appointments.length === 0) {
                return [];
            }
            const groupedByTitle = appointments.reduce((acc, appointment) => {
                const startDate = new Date(appointment.start);
                const endDate = new Date(appointment.end);
                const durationMs = endDate.getTime() - startDate.getTime();
                const totalMinutes = Math.floor(durationMs / (1000 * 60));
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                if (!acc[appointment.title]) {
                    acc[appointment.title] = {
                        title: appointment.title,
                        totalDuration: {
                            hours: 0,
                            minutes: 0,
                            totalMinutes: 0,
                        },
                        appointments: [],
                    };
                }
                acc[appointment.title].totalDuration.hours += hours;
                acc[appointment.title].totalDuration.minutes += minutes;
                acc[appointment.title].totalDuration.totalMinutes += totalMinutes;
                acc[appointment.title].appointments.push(appointment);
                return acc;
            }, {});
            return Object.values(groupedByTitle).map((group) => {
                const totalMinutes = group.totalDuration.totalMinutes;
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                return {
                    title: group.title,
                    appointments: group.appointments,
                    totalDuration: {
                        hours,
                        minutes,
                        totalMinutes,
                        formatted: `${hours > 0 ? `${hours}h ` : ""}${minutes}m`,
                    },
                };
            });
        }
        catch (error) {
            this.logger.error("Error in findAllGroupedByTitle", error);
            throw error;
        }
    }
    calculateDuration(start, end) {
        const diffInMs = end.getTime() - start.getTime();
        return {
            hours: Math.floor(diffInMs / (1000 * 60 * 60)),
            minutes: Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60)),
            totalMinutes: Math.floor(diffInMs / (1000 * 60)),
            formatted: this.formatDuration(diffInMs),
        };
    }
    formatDuration(diffInMs) {
        const hours = Math.floor(diffInMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours > 0 ? `${hours}h ` : ""}${minutes}m`;
    }
    async findOne(id) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return null;
        }
        return this.appointmentModel.findById(id).exec();
    }
    async update(id, updateAppointmentDto) {
        const appointment = await this.appointmentModel.findById(id).exec();
        if (!appointment) {
            return null;
        }
        return this.appointmentModel
            .findByIdAndUpdate(id, updateAppointmentDto, { new: true })
            .exec();
    }
    async delete(id) {
        const appointment = await this.appointmentModel.findById(id).exec();
        if (!appointment) {
            return null;
        }
        if (appointment.recurrenceId) {
            const modifiedAppointment = new this.appointmentModel(Object.assign(Object.assign({}, appointment.toObject()), { isRecurring: false, recurrenceId: undefined, originalStart: undefined, _id: undefined }));
            await modifiedAppointment.save();
            await this.appointmentModel.deleteOne({ _id: appointment._id });
            return modifiedAppointment;
        }
        return this.appointmentModel.findByIdAndDelete(id).exec();
    }
    async addTask(appointmentId, taskData) {
        console.log(`[Service] AddTask iniciado - Appointment: ${appointmentId}`, {
            taskData,
            dbOperation: "findByIdAndUpdate",
        });
        const updatedAppointment = await this.appointmentModel
            .findByIdAndUpdate(appointmentId, { $push: { tasks: taskData } }, { new: true, runValidators: true })
            .exec();
        if (!updatedAppointment) {
            console.error(`[Service] AddTask falhou - Appointment não encontrado: ${appointmentId}`);
            throw new Error("Appointment not found");
        }
        console.log(`[Service] AddTask concluído - Appointment: ${appointmentId}`, {
            newTaskId: updatedAppointment.tasks.slice(-1)[0]._id,
            taskCount: updatedAppointment.tasks.length,
            dbResponse: {
                status: "success",
                modifiedCount: 1,
            },
        });
        return updatedAppointment;
    }
    async updateTask(appointmentId, taskId, updateData) {
        if (appointmentId === taskId) {
            throw new Error("Invalid task ID: cannot be same as appointment ID");
        }
        const appId = new mongoose_2.Types.ObjectId(appointmentId);
        const tId = new mongoose_2.Types.ObjectId(taskId);
        const updated = await this.appointmentModel.findOneAndUpdate({
            _id: appId,
            "tasks._id": tId,
        }, {
            $set: {
                "tasks.$.completed": updateData.completed,
                "tasks.$.updatedAt": new Date(),
            },
        }, { new: true });
        if (!updated) {
            throw new Error("Task not found");
        }
        return updated;
    }
    async removeTask(appointmentId, taskId) {
        this.logger.debug(`Tentando remover tarefa - Appointment: ${appointmentId}, Task: ${taskId}`);
        try {
            const result = await this.appointmentModel
                .findByIdAndUpdate(appointmentId, { $pull: { tasks: { _id: new mongoose.Types.ObjectId(taskId) } } }, { new: true })
                .exec();
            if (!result) {
                this.logger.warn(`Tarefa não encontrada para remoção - Appointment: ${appointmentId}, Task: ${taskId}`);
                return null;
            }
            this.logger.log(`Tarefa removida com sucesso - Appointment: ${appointmentId}, Task: ${taskId}`);
            return result;
        }
        catch (error) {
            this.logger.error(`Falha ao remover tarefa - Appointment: ${appointmentId}, Task: ${taskId}`, error);
            throw error;
        }
    }
};
exports.AppointmentService = AppointmentService;
exports.AppointmentService = AppointmentService = AppointmentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(appointment_schema_1.Appointment.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], AppointmentService);
//# sourceMappingURL=appointment.service.js.map