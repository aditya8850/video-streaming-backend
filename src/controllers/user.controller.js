import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens.")
  }
}

const registerUser = asyncHandler(async (req, res) => {
  // get user-details from frontend
  // validation-not empty
  // check if user already exists:username,email
  // check for images,check for avatar
  // upload them to cloudinary
  // create userobject - create entry in db
  // remove password nd refresh token filed from response
  // check for user creation
  // return res
  const { fullName, email, username, password } = req.body;
  if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  let coverImageLocalPath;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage > 0) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is reqd.");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)
  if (!avatar) {
    throw new ApiError(400, "Avatar file is reqd.");
  }
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
  })
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user")
  }
  return res.status(201).json(
    new ApiResponse(200, createdUser, "User Registered Succesfully")
  )

});

const loginUser = asyncHandler(async (req, res) => {
  // req.body > data
  //username or email based login
  //find the user
  // password check 
  // access and refresh token 
  //send the tokens as secure cookies
  //send res after succesfull login
  const { email, username, password } = req.body
  if (!username && !email) {
    throw new ApiError(400, "username or email is reqd.")
  }

  const user = await User.findOne({
    $or: [{ email }, { username }]
  })


  if (!user) {
    throw new ApiError(404, "User does not exist.")
  }
  const isPasswordValid = await user.isPasswordCorrect(password)
  console.log(isPasswordValid);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials.")
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
  const options = {
    httpOnly: true,
    secure: true,
  }
  return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken
        },
        "user loggedin successfully")
    )
});

const logoutUser = asyncHandler(async (req, res) => {
  //clear cookies
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:
      {
        refreshToken: undefined
      }
    },
    {
      new: true

    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  }
  return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(new ApiResponse(200,{},"User Logged Out."))

})
export { registerUser, loginUser, logoutUser };
