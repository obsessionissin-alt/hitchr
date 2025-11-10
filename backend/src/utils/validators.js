const Joi = require('joi');

const locationSchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
});

const schemas = {
  verifyToken: Joi.object({
    firebaseToken: Joi.string().required(),
  }),

  updateProfile: Joi.object({
    name: Joi.string().min(2).max(100),
    role: Joi.string().valid('rider', 'pilot'),
    avatar_url: Joi.string().uri(),
  }).min(1),

  updateLocation: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
    heading: Joi.number().min(0).max(360),
    speed: Joi.number().min(0).max(200),
  }),

  nearbyPilots: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
    radius: Joi.number().min(100).max(10000).default(2000),
  }),

  notifyRide: Joi.object({
    riderId: Joi.string().uuid().required(),
    pilotId: Joi.string().uuid().required(),
    origin: locationSchema.required(),
    destination: locationSchema.required(),
    originAddress: Joi.string().max(500),
    destinationAddress: Joi.string().max(500),
  }),

  confirmRide: Joi.object({
    userId: Joi.string().uuid().required(),
  }),

  telemetry: Joi.object({
    points: Joi.array().items(
      Joi.object({
        lat: Joi.number().min(-90).max(90).required(),
        lng: Joi.number().min(-180).max(180).required(),
        speed: Joi.number().min(0).max(200),
        timestamp: Joi.date().iso().required(),
      })
    ).min(1).required(),
  }),

  endRide: Joi.object({
    endLocation: locationSchema.required(),
  }),
};

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      return res.status(400).json({ error: 'Validation error', details: errors });
    }
    
    req.validatedData = value;
    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      return res.status(400).json({ error: 'Validation error', details: errors });
    }
    
    req.validatedQuery = value;
    next();
  };
};

module.exports = {
  schemas,
  validate,
  validateQuery,
};
