import { Request, Response } from "express"
import { Classroom } from "../models/classroomModel.js"
import { User } from "../models/userModel.js"

const generateClassroomCode = (): string => {
	return Array.from({ length: 6 }, () =>
		String.fromCharCode(65 + Math.floor(Math.random() * 26))
	).join("")
}

export const getClassroomsForStudent = async (
	req: Request,
	res: Response
): Promise<any> => {
	try {
		const { userId } = req.params

		if (!userId) {
			return res.status(400).json({ error: "User ID is required" })
		}

		const classrooms = await Classroom.find({ students: userId })

		res.json({ classrooms })
	} catch (error) {
		res.status(500).json({ error: "Internal server error" })
	}
}

export const getClassroomsForTeacher = async (
	req: Request,
	res: Response
): Promise<any> => {
	try {
		const { userId } = req.params

		if (!userId) {
			return res.status(400).json({ error: "User ID is required" })
		}

		const classrooms = await Classroom.find({ teacherId: userId })

		res.json({ classrooms })
	} catch (error) {
		res.status(500).json({ error: "Internal server error" })
	}
}

export const deleteClassroom = async (req: Request, res: Response): Promise<any> => {
	try {
		const { userId, classroomId } = req.params

		if (!userId || !classroomId) {
			return res
				.status(400)
				.json({ error: "User ID and Classroom ID are required" })
		}

		const classroom = await Classroom.findById(classroomId)

		if (!classroom) {
			return res.status(404).json({ error: "Classroom not found" })
		}

		if (classroom.teacherId !== userId) {
			return res
				.status(403)
				.json({ error: "You are not authorized to delete this classroom" })
		}

		await Classroom.findByIdAndDelete(classroomId)

		res.json({ message: "Classroom deleted successfully" })
	} catch (error) {
		res.status(500).json({ error: "Internal server error" })
	}
}

export const leaveClassroom = async (req: Request, res: Response): Promise<any> => {
	try {
		const { userId, classroomId } = req.body

		if (!userId || !classroomId) {
			return res
				.status(400)
				.json({ error: "User ID and Classroom ID are required" })
		}

		const classroom = await Classroom.findById(classroomId)

		if (!classroom) {
			return res.status(404).json({ error: "Classroom not found" })
		}

		if (!classroom.students.includes(userId)) {
			return res
				.status(403)
				.json({ error: "You are not a student in this classroom" })
		}

		classroom.students = classroom.students.filter(
			(studentId: string) => studentId !== userId
		)
		await classroom.save()

		res.json({ message: "Successfully left the classroom" })
	} catch (error) {
		res.status(500).json({ error: "Internal server error" })
	}
}

export const createClassroom = async (req: Request, res: Response): Promise<any> => {
	try {
		const { classroomName, teacherId, teacherName } = req.body

		if (!classroomName || !teacherId || !teacherName) {
			return res.status(400).json({
				error: "Classroom name, Teacher ID, and Teacher Name are required",
			})
		}

		const classroomCode = generateClassroomCode()

		const newClassroom = new Classroom({
			classroomName,
			classroomCode,
			teacherId,
			teacherName,
			students: [],
		})

		await newClassroom.save()

		res.json({ message: "Classroom created successfully", classroom: newClassroom })
	} catch (error) {
		res.status(500).json({ error: "Internal server error" })
	}
}

export const joinClassroom = async (req: Request, res: Response): Promise<any> => {
	try {
		const { userId, classroomCode } = req.body

		if (!userId || !classroomCode) {
			return res
				.status(400)
				.json({ error: "User ID and Classroom Code are required" })
		}

		const classroom = await Classroom.findOne({ classroomCode })

		if (!classroom) {
			return res.status(404).json({ error: "Classroom not found" })
		}

		if (classroom.teacherId === userId) {
			return res
				.status(400)
				.json({ error: "Teachers cannot join their own classroom as students" })
		}

		if (classroom.students.includes(userId)) {
			return res
				.status(400)
				.json({ error: "You are already a student in this classroom" })
		}

		classroom.students.push(userId)
		await classroom.save()

		res.json({ message: "Successfully joined the classroom", classroom })
	} catch (error) {
		res.status(500).json({ error: "Internal server error" })
	}
}

export const getClassroomByCode = async (req: Request, res: Response): Promise<any> => {
	try {
		const { id } = req.params

		if (!id) {
			return res.status(400).json({ error: "Classroom code is required" })
		}

		const classroom = await Classroom.findOne({ id })

		if (!classroom) {
			return res.status(404).json({ error: "Classroom not found" })
		}

		res.json({ classroom })
	} catch (error) {
		res.status(500).json({ error: "Internal server error" })
	}
}

export const getStudentNames = async (req: Request, res: Response): Promise<any> => {
	try {
		const { studentIds } = req.body

		if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
			return res.status(400).json({ error: "A list of student IDs is required" })
		}

		const students = await User.find({ _id: { $in: studentIds } }, "name")

		res.json({ students })
	} catch (error) {
		res.status(500).json({ error: "Internal server error" })
	}
}
