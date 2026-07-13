const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/requireAdmin");  // ← ADD THIS
const {
    submitVerification,
    getPendingBuilders,
    reviewBuilder,
    submitProject,
    uploadProjectDocuments,
    addMilestone,
    getMyProjects,
    getPendingProjects,
    reviewProject,
    getProjectDetails,
    completeMilestone,
    addProjectUpdate,
    deleteProjectDocument,
} = require("../controllers/builderController");

// Builder verification
router.post("/verify", authMiddleware, submitVerification);

// Builder projects
router.post("/project/submit", authMiddleware, submitProject);
router.post("/project/:project_id/documents", authMiddleware, uploadProjectDocuments);
router.post("/project/:project_id/milestone", authMiddleware, addMilestone);
router.get("/project/my", authMiddleware, getMyProjects);
router.get("/project/:project_id", authMiddleware, getProjectDetails);
router.post("/project/:project_id/update", authMiddleware, addProjectUpdate);
router.delete("/project/document/:document_id", authMiddleware, deleteProjectDocument);

// Admin routes
router.get("/pending/builders", authMiddleware, requireAdmin, getPendingBuilders);       // ← ADD requireAdmin
router.patch("/review/builder/:id", authMiddleware, requireAdmin, reviewBuilder);        // ← ADD requireAdmin
router.get("/pending/projects", authMiddleware, requireAdmin, getPendingProjects);       // ← ADD requireAdmin
router.patch("/review/project/:project_id", authMiddleware, requireAdmin, reviewProject); // ← ADD requireAdmin
router.patch("/milestone/:milestone_id/complete", authMiddleware, requireAdmin, completeMilestone);

module.exports = router;