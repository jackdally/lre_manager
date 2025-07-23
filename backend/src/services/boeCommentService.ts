import { AppDataSource } from '../config/database';
import { BOEComment } from '../entities/BOEComment';
import { BOEVersion } from '../entities/BOEVersion';

const boeCommentRepository = AppDataSource.getRepository(BOEComment);
const boeVersionRepository = AppDataSource.getRepository(BOEVersion);

export interface CreateBOECommentRequest {
  boeVersionId: string;
  commentType: 'Review' | 'Approval' | 'Rejection' | 'General' | 'Revision' | 'Clarification';
  comment: string;
  authorName: string;
  authorRole: string;
  authorEmail?: string;
  isInternal?: boolean;
}

export interface UpdateBOECommentRequest {
  comment?: string;
  isResolved?: boolean;
  resolvedBy?: string;
  resolutionNotes?: string;
}

export interface BOECommentResponse {
  id: string;
  boeVersionId: string;
  commentType: string;
  comment: string;
  authorName: string;
  authorRole: string;
  authorEmail?: string;
  isInternal: boolean;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class BOECommentService {
  /**
   * Create a new comment for a BOE version
   */
  static async createComment(request: CreateBOECommentRequest): Promise<BOECommentResponse> {
    // Validate BOE version exists
    const boeVersion = await boeVersionRepository.findOne({
      where: { id: request.boeVersionId }
    });

    if (!boeVersion) {
      throw new Error('BOE version not found');
    }

    // Validate required fields
    if (!request.comment.trim()) {
      throw new Error('Comment text is required');
    }

    if (!request.authorName.trim()) {
      throw new Error('Author name is required');
    }

    if (!request.authorRole.trim()) {
      throw new Error('Author role is required');
    }

    // Create the comment
    const comment = new BOEComment();
    comment.boeVersionId = request.boeVersionId;
    comment.commentType = request.commentType;
    comment.comment = request.comment.trim();
    comment.authorName = request.authorName.trim();
    comment.authorRole = request.authorRole.trim();
    comment.authorEmail = request.authorEmail?.trim();
    comment.isInternal = request.isInternal || false;
    comment.isResolved = false;

    const savedComment = await boeCommentRepository.save(comment);
    return this.mapToResponse(savedComment);
  }

  /**
   * Get all comments for a BOE version
   */
  static async getCommentsByVersion(boeVersionId: string): Promise<BOECommentResponse[]> {
    const comments = await boeCommentRepository.find({
      where: { boeVersionId },
      order: { createdAt: 'ASC' }
    });

    return comments.map(comment => this.mapToResponse(comment));
  }

  /**
   * Get a specific comment by ID
   */
  static async getCommentById(commentId: string): Promise<BOECommentResponse> {
    const comment = await boeCommentRepository.findOne({
      where: { id: commentId }
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    return this.mapToResponse(comment);
  }

  /**
   * Update a comment
   */
  static async updateComment(commentId: string, request: UpdateBOECommentRequest): Promise<BOECommentResponse> {
    const comment = await boeCommentRepository.findOne({
      where: { id: commentId }
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    // Update fields
    if (request.comment !== undefined) {
      if (!request.comment.trim()) {
        throw new Error('Comment text cannot be empty');
      }
      comment.comment = request.comment.trim();
    }

    if (request.isResolved !== undefined) {
      comment.isResolved = request.isResolved;
      
      if (request.isResolved) {
        comment.resolvedAt = new Date();
        if (request.resolvedBy) {
          comment.resolvedBy = request.resolvedBy;
        }
      } else {
        comment.resolvedAt = undefined;
        comment.resolvedBy = undefined;
        comment.resolutionNotes = undefined;
      }
    }

    if (request.resolvedBy !== undefined) {
      comment.resolvedBy = request.resolvedBy;
    }

    if (request.resolutionNotes !== undefined) {
      comment.resolutionNotes = request.resolutionNotes?.trim();
    }

    const updatedComment = await boeCommentRepository.save(comment);
    return this.mapToResponse(updatedComment);
  }

  /**
   * Delete a comment
   */
  static async deleteComment(commentId: string): Promise<void> {
    const comment = await boeCommentRepository.findOne({
      where: { id: commentId }
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    await boeCommentRepository.remove(comment);
  }

  /**
   * Get comment statistics for a BOE version
   */
  static async getCommentStats(boeVersionId: string): Promise<{
    total: number;
    resolved: number;
    unresolved: number;
    byType: Record<string, number>;
  }> {
    const comments = await boeCommentRepository.find({
      where: { boeVersionId }
    });

    const stats = {
      total: comments.length,
      resolved: comments.filter(c => c.isResolved).length,
      unresolved: comments.filter(c => !c.isResolved).length,
      byType: {} as Record<string, number>
    };

    // Count by type
    comments.forEach(comment => {
      stats.byType[comment.commentType] = (stats.byType[comment.commentType] || 0) + 1;
    });

    return stats;
  }

  /**
   * Resolve multiple comments at once
   */
  static async resolveComments(commentIds: string[], resolvedBy: string, resolutionNotes?: string): Promise<BOECommentResponse[]> {
    const comments = await boeCommentRepository.findByIds(commentIds);

    if (comments.length !== commentIds.length) {
      throw new Error('Some comments not found');
    }

    const resolvedComments = comments.map(comment => {
      comment.isResolved = true;
      comment.resolvedBy = resolvedBy;
      comment.resolvedAt = new Date();
      if (resolutionNotes) {
        comment.resolutionNotes = resolutionNotes;
      }
      return comment;
    });

    const savedComments = await boeCommentRepository.save(resolvedComments);
    return savedComments.map(comment => this.mapToResponse(comment));
  }

  /**
   * Map entity to response DTO
   */
  private static mapToResponse(comment: BOEComment): BOECommentResponse {
    return {
      id: comment.id,
      boeVersionId: comment.boeVersionId,
      commentType: comment.commentType,
      comment: comment.comment,
      authorName: comment.authorName,
      authorRole: comment.authorRole,
      authorEmail: comment.authorEmail,
      isInternal: comment.isInternal,
      isResolved: comment.isResolved,
      resolvedBy: comment.resolvedBy,
      resolvedAt: comment.resolvedAt,
      resolutionNotes: comment.resolutionNotes,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt
    };
  }
} 