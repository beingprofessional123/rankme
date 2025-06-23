const db = require('../../models');
const { Op } = require('sequelize');

const planController = {
  // GET /api/admin/plan-management-list
  getPlans: async (req, res) => {
    try {
      const plans = await db.SubscriptionPlan.findAll({
        order: [['createdAt', 'DESC']],
      });

      res.status(200).json({
        status: 'success',
        status_code: 200,
        status_message: 'OK',
        message: 'Plans fetched successfully',
        results: plans,
      });
    } catch (error) {
      console.error('Error fetching plans:', error);
      res.status(500).json({
        status: 'error',
        status_code: 500,
        status_message: 'INTERNAL_SERVER_ERROR',
        message: 'Error fetching plans',
        results: null,
      });
    }
  },

  // GET /api/admin/plan-management/:id
  getPlanById: async (req, res) => {
    try {
      const plan = await db.SubscriptionPlan.findByPk(req.params.id);

      if (!plan) {
        return res.status(404).json({
          status: 'error',
          status_code: 404,
          status_message: 'NOT_FOUND',
          message: 'Plan not found',
          results: null,
        });
      }

      res.status(200).json({
        status: 'success',
        status_code: 200,
        status_message: 'OK',
        message: 'Plan fetched successfully',
        results: plan,
      });
    } catch (error) {
      console.error('Error fetching plan:', error);
      res.status(500).json({
        status: 'error',
        status_code: 500,
        status_message: 'INTERNAL_SERVER_ERROR',
        message: 'Error fetching plan',
        results: null,
      });
    }
  },

  // POST /api/admin/plan-management
  createPlan: async (req, res) => {
    try {
      const { name, price, billing_period, features } = req.body;

      if (!name || !price || !billing_period) {
        return res.status(400).json({
          status: 'error',
          status_code: 400,
          status_message: 'BAD_REQUEST',
          message: 'Name, price, and billing period are required',
          results: null,
        });
      }

      const newPlan = await db.SubscriptionPlan.create({
        name,
        price,
        billing_period,
        features,
      });

      res.status(201).json({
        status: 'success',
        status_code: 201,
        status_message: 'CREATED',
        message: 'Plan created successfully',
        results: newPlan,
      });
    } catch (error) {
      console.error('Error creating plan:', error);
      res.status(500).json({
        status: 'error',
        status_code: 500,
        status_message: 'INTERNAL_SERVER_ERROR',
        message: 'Error creating plan',
        results: null,
      });
    }
  },

  // PUT /api/admin/plan-management/:id
  updatePlan: async (req, res) => {
    try {
      const plan = await db.SubscriptionPlan.findByPk(req.params.id);

      if (!plan) {
        return res.status(404).json({
          status: 'error',
          status_code: 404,
          status_message: 'NOT_FOUND',
          message: 'Plan not found',
          results: null,
        });
      }

      const { name, price, billing_period, features } = req.body;

      await plan.update({
        name,
        price,
        billing_period,
        features,
      });

      res.status(200).json({
        status: 'success',
        status_code: 200,
        status_message: 'OK',
        message: 'Plan updated successfully',
        results: plan,
      });
    } catch (error) {
      console.error('Error updating plan:', error);
      res.status(500).json({
        status: 'error',
        status_code: 500,
        status_message: 'INTERNAL_SERVER_ERROR',
        message: 'Error updating plan',
        results: null,
      });
    }
  },

  // DELETE /api/admin/plan-management/:id
  deletePlan: async (req, res) => {
    try {
      const plan = await db.SubscriptionPlan.findByPk(req.params.id);

      if (!plan) {
        return res.status(404).json({
          status: 'error',
          status_code: 404,
          status_message: 'NOT_FOUND',
          message: 'Plan not found',
          results: null,
        });
      }

      await plan.destroy();

      res.status(200).json({
        status: 'success',
        status_code: 200,
        status_message: 'OK',
        message: 'Plan deleted successfully',
        results: null,
      });
    } catch (error) {
      console.error('Error deleting plan:', error);
      res.status(500).json({
        status: 'error',
        status_code: 500,
        status_message: 'INTERNAL_SERVER_ERROR',
        message: 'Error deleting plan',
        results: null,
      });
    }
  },
};

module.exports = planController;
