import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/index.js";
import bcrypt from "bcryptjs";


const changePin = AsyncHandler(async (req, res) => {
  const { current_pin, new_pin, confirm_pin } = req.body;

  // Validate new_pin
  if (!new_pin || !confirm_pin) {
    throw new ApiError(422, "new_pin and confirm_pin are required.", {
      code: "VALIDATION_ERROR",
      fields: {
        ...(!new_pin && { new_pin: "new_pin is required." }),
        ...(!confirm_pin && { confirm_pin: "confirm_pin is required." }),
      },
    });
  }

  // Must be exactly 4 digits
  if (!/^\d{4}$/.test(new_pin)) {
    throw new ApiError(422, "PIN must be exactly 4 digits.", {
      code: "VALIDATION_ERROR",
      fields: { new_pin: "PIN must be exactly 4 digits." },
    });
  }

  // PINs must match
  if (new_pin !== confirm_pin) {
    throw new ApiError(422, "PINs do not match.", {
      code: "VALIDATION_ERROR",
      fields: { confirm_pin: "confirm_pin does not match new_pin." },
    });
  }

  // Reject weak PINs
  const weakPins = ["1234","4321","0000","1111","2222","3333","4444","5555","6666","7777","8888","9999"];
  if (weakPins.includes(new_pin)) {
    throw new ApiError(422, "PIN is too weak. Avoid sequential or repeated digits.", {
      code: "WEAK_PIN",
      fields: { new_pin: "Choose a stronger PIN." },
    });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });

  // If user already has a PIN, verify current_pin first
  if (user.pin_hash) {
    if (!current_pin) {
      throw new ApiError(422, "current_pin is required to change your PIN.", {
        code: "VALIDATION_ERROR",
        fields: { current_pin: "current_pin is required." },
      });
    }
    const isPinValid = await bcrypt.compare(current_pin, user.pin_hash);
    if (!isPinValid) {
      throw new ApiError(401, "Current PIN is incorrect.", {
        code: "INVALID_PIN",
      });
    }
  }

  // Hash and save new PIN
  const hashedPin = await bcrypt.hash(new_pin, 10);
  await prisma.user.update({
    where: { id: req.user.id },
    data: { pin_hash: hashedPin },
  });

  return res.status(200).json(
    new ApiResponse(200, null, "Transaction PIN set successfully.")
  );
});

const verifyPin = AsyncHandler(async (req, res) => {
  const { pin } = req.body;

  if (!pin) {
    throw new ApiError(422, "PIN is required.", {
      code: "VALIDATION_ERROR",
      fields: { pin: "PIN is required." },
    });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });

  if (!user.pin_hash) {
    throw new ApiError(400, "No PIN set. Please set a transaction PIN first.", {
      code: "PIN_NOT_SET",
    });
  }

  const isPinValid = await bcrypt.compare(pin, user.pin_hash);
  if (!isPinValid) {
    throw new ApiError(401, "Incorrect PIN.", { code: "INVALID_PIN" });
  }

  return res.status(200).json(
    new ApiResponse(200, { verified: true }, "PIN verified.")
  );
});

export { changePin, verifyPin };