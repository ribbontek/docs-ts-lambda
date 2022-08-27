import createFile from "@functions/create-file";
import createPost from "@functions/create-post";
import deleteFile from "@functions/delete-file";
import deletePost from "@functions/delete-post";
import fileProcessor from "@functions/file-processor";
import forgetPassword from "@functions/forget-password";
import getFile from "@functions/get-file";
import getPost from "@functions/get-post";
import login from "@functions/login";
import registerUser from "@functions/register-user";
import resetPassword from "@functions/reset-password";
import searchPosts from "@functions/search-posts";
import updatePost from "@functions/update-post";
import verifyToken from "@functions/verify-token";

/* tslint:disable */
export const functions = {
    "create-post": createPost,
    "update-post": updatePost,
    "delete-post": deletePost,
    "search-post": searchPosts,
    "get-post": getPost,
    "create-file": createFile,
    "get-file": getFile,
    "delete-file": deleteFile,
    "login": login,
    "register-user": registerUser,
    "reset-password": resetPassword,
    "verify-token": verifyToken,
    "forget-password": forgetPassword,
    "file-processor": fileProcessor,
};
/* tslint:enable */
