require('dotenv').config();


const express = require('express');
const ejs = require('ejs');
const bodyParser =require('body-parser');
const mongoose = require('mongoose');
const port =process.env.PORT || 5000;
const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@cluster0.igzzx.mongodb.net`;


// connection mongoose
mongoose.connect(uri+'/todosDB',{useNewUrlParser:true, useUnifiedTopology:true})

const todosSchema = new mongoose.Schema({
    name: String, 
    checked: Boolean
})

const Todo = mongoose.model('todos',todosSchema);

const listSchema = new mongoose.Schema({
    name: String,
    todos: [todosSchema]
})

const List = mongoose.model('list',listSchema);

//routes



const app = express(); 
app.use(bodyParser.urlencoded({extended:true}))
app.set('view engine','ejs');

app.get("/",async (req,res)=>{
    Todo.find((err, myTodos)=>{
        if(err) console.log(err);
        else {
            res.render("index",{todos:myTodos,listName:"today"});
        }
    })  
})

app.get("/:listName",(req,res)=>{
    const listName = req.params.listName;
    List.findOne({name: listName},(err,foundList)=>{
        if(err){
            console.log(err);
        }else{
            if(!foundList){
                const newList = new List({
                    name: listName,
                    todos:[]
                })
                newList.save();
                res.redirect(`/${listName}`)
            }else{
                res.render("index",{todos:foundList.todos,listName:listName})
            }
        }
    })  
})



app.post("/add-todo",async (req,res)=>{
    const listName = req.body.theName;
    const newTodo = req.body.newTodo; 
    const addTodo = new Todo({
        name: newTodo,
        checked:false
    })
    if (listName=="today"){
        addTodo.save();
        res.redirect("/")
    }else{
        List.findOneAndUpdate(
            {name:listName},
            {$push:{todos:addTodo}},
            err=>{
                if(err)
                    console.log(err);
                else
                        res.redirect(`/${listName}`);
                    
            }
        )
    }
});

app.post("/remove",async (req, res)=>{
    const theId = req.body.getTheId;
    const listName = req.body.theName;
    console.log(listName);
    console.log(theId);
    if(listName=="today"){
        Todo.deleteOne({_id:theId},err=>{
            if(err){
                consolge.log(err)
            }else{
                res.redirect("/")
            }
        })
    }
    else{
        console.log(theId);
        List.findOneAndUpdate(
            {name:listName},
            {$pull:{todos:{_id:theId}}},
            (err,foundList)=>{
                if(err){
                    console.log(err)
                }
                else{
                    console.log(foundList)
                    res.redirect(`/${listName}`)
                }
            }
        )
    }
})

app.post("/checking",async (req,res)=>{
    const theId = req.body.theId;
    const listName =req.body.theName;
    if(listName=="today"){
        Todo.findOne({_id:theId},(err,foundTodo)=>{
            if(err)
                console.log(err);
            else{
                foundTodo.checked=!foundTodo.checked;
                foundTodo.save();
                res.redirect("/")
            }

        })
    }else{
        List.findOne({name:listName},(err,foundList)=>{
            if(err) console.log(err);
            else{
                foundList.todos.forEach(todo=>{
                    if(todo._id == theId){
                        todo.checked=!todo.checked;
                    }
                })
                foundList.save();
                res.redirect(`/${listName}`)
            }
        })
    }
})

app.listen(port, ()=>{
    console.log("server started at port: "+port );
})

