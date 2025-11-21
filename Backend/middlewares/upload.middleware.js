import multer from "multer";

const storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,"./temp")
    },
    filename: function(req,file,cb){
        const unique = Date.now() + "-" + Math.round(Math.random() * 1E9)
        cb(null,file.originalname + "-" + unique)
    }
})

export const upload = multer({storage})