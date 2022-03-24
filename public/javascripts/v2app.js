
document.addEventListener("DOMContentLoaded", () => {

    const model = (function() {
        let todos = []

        return {
            getAllTodosFromDatabase() {
                try {
                    return this.myfetchTodos("api/todos")
                } catch (error) {
                    throw new Error("An error occured while trying to get todos.")
                }
            },
            getTodo(id) {
                try {
                    return this.myfetchTodos(`api/todos/${id}`);
                } catch (error) {
                    throw new Error(`The todo with an id of ${id} could not be found. :(`)
                }
            },

            deleteTodo(id) {
                this.myfetchTodos(`api/todos/${id}`, {
                    method: "DELETE",
                }).then(() => {
                    console.log(`The todo with an ID of ${id} has been deleted. :)`);
                }).catch(() => {
                    `An error occured while trying to delete the todo. Please try again.`
                })

                controller.getAllTodosAndRender(this.todo);
            },

            addTodo(todo) {
                todo = JSON.stringify(todo);
                this.myfetchTodos(`api/todos`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: todo,
                }).then(data => {
                    console.log(`The todo titled: "${data.title}" with an ID of ${data.id}), was added`);
                }).catch(() => {
                    `An error occured while attempting to add the todo. Please try again. :(`
                })

                controller.getAllTodosAndRender(this.todos);
            },

            updateTodo(id, todo) {
                todo = JSON.stringify(todo);

                try {
                    this.myfetchTodos(`api/todos/${id}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: todo,
                    }).then(data => {
                        console.log(`The todo with title ${data.title} with ID of ${data.id} was updated. :)`);
                    })

                    controller.getAllTodosAndRender(this.todos);
                } catch (error) {
                    throw new Error(`An error occured while attempting to update your todo.`);
                }
            },

            showAllTodos() {
                return this.model.todos;
            },

            async myfetchTodos(targetEndPoint, payload) {
                const res = await fetch(targetEndPoint,payload);

                if (!res.ok) {
                    throw new Error(`An HTTP ${res.status} error occured. :(`)
                }
                // check if res is json
                // try {
                //     // ! Keep an eye on this to check if it works properly
                //     const text = res.text();
                //     const data = JSON.parse(text);
                //     return data;
                // } catch(err) {
                    return res.json();
                // }
            },

            addDueDateToTodos(todos) {
                todos.reduce((acc,curr) => {
                    let date;
                    if (!curr.month || !curr.year) {
                        date = "No Due Date";
                        curr["due_date"] = date;
                        acc.push(curr)
                    } else {
                        let month = curr.month;
                        let year = curr.year.substr(-2);
                        let date = `${month}/${year}`
                        curr["due_date"] = date;
                        acc.push(curr)
                    }
                    return acc
                },[])

                return todos
            }
        }
    })()

    const view = {
        templates: {},
        current_section: {
            title: "All Todos",
            data: 0
        },
        getHandlebarsTemplates() {
            const allTemplates = document.querySelectorAll(`[type="text/x-handlebars"]`)
            const allPartials = document.querySelectorAll(`[data-type="partial"]`);

            allTemplates.forEach(temp => {
                this.templates[temp.id] = Handlebars.compile(temp.innerHTML);
            });

            allPartials.forEach(part => {
                Handlebars.registerPartial(part.id,part.innerHTML);
            })
        },

        displayMainPage(todosArrayOfObjectsWithDueDatesAndTodosDates,title) {
            let theBody = document.querySelector("body");
            theBody.innerHTML = "";
            // theBody.insertAdjacentHTML("afterbegin",this.templates.main_template())

            theBody.innerHTML = this.templates.main_template();

            let currentContainer = document.querySelector("tbody");
            const mainPageHeader = document.querySelector("#items").firstElementChild

             // set current section state
             this.current_section.data = todosArrayOfObjectsWithDueDatesAndTodosDates.length;
             this.current_section.title = title;

             //display main page header
             mainPageHeader.innerHTML = "";
             mainPageHeader.innerHTML = this.templates.title_template({current_section: this.current_section})

             // display main page todos
             currentContainer.innerHTML = "";
             currentContainer.innerHTML = this.templates.list_template( {selected: todosArrayOfObjectsWithDueDatesAndTodosDates})
        },
        displaySidebar(todosArrayOfObjectsWithDueDatesAndTodosDates) {

            const sidebarAllTodosHeader = document.querySelector("#all_todos")
            //dispplay sidebar header todos
            sidebarAllTodosHeader.innerHTML = "";
            sidebarAllTodosHeader.innerHTML = this.templates.all_todos_template({todos: todosArrayOfObjectsWithDueDatesAndTodosDates})

            // display sidebar todos by date
            const sidebarAllListItems = document.querySelector("#all_lists");
            sidebarAllListItems.innerHTML = "";
            sidebarAllListItems.innerHTML = this.templates.all_list_template({todos_by_date: todosArrayOfObjectsWithDueDatesAndTodosDates[0].todos_by_date})

            // display sidebar todos completed
            const sidebarCompletedTasksByMonth = document.querySelector("#completed_lists");
            sidebarCompletedTasksByMonth.innerHTML = "";
            sidebarCompletedTasksByMonth.innerHTML = this.templates.completed_list_template({done_todos_by_date: todosArrayOfObjectsWithDueDatesAndTodosDates[0].done_todos_by_date})

        },

        displayForm(todo) {
            const modalLayer = document.querySelector("#modal_layer")
            const formModal = document.querySelector("#form_modal")


            if (todo) {
                modalLayer.style.display = "block"
                formModal.style.display = "block";

                document.querySelector("#title").setAttribute("value",todo.title)
                // console.log(document.querySelector(`[name="description"]`))
                document.querySelector(`[name="description"]`).value = todo.description;
                if (todo.year) {
                    document.querySelector("#due_year").value = todo.year
                    console.log(document.querySelector("#due_year"));
                }

                if (todo.month) {
                    document.querySelector("#due_month").value = todo.month;
                }

                if (todo.day) {
                    document.querySelector("#due_day").value = todo.day
                }
                console.log("Wait! There is a todo here!");

            } else {
                modalLayer.style.display = "block"
                formModal.style.display = "block";
            }
        },

        bindSaveButton(handler) {
            const form = document.querySelector("form")

            form.addEventListener("click", e => {
                e.preventDefault();

                if (e.target.getAttribute("type") === "submit") {
                    const inputs = {};
                    //  A little messy putting validation in here, but I have to get the data out of the object, so I might as well do a little validation.
                    const formData = new FormData(form)
                    for (var [key,value] of formData.entries()) {
                        if (key === "description") {
                            key === "description" && value.length > 1 ? inputs[key] = value : inputs[key] = "";
                        } else if (key === "title") {
                            key === "title" && value.length > 3 ? inputs[key] = value : inputs[key] = null;
                        } else if (key === "due_day") {
                            key === "due_day" && value === "Day" ? inputs[key] = "" : inputs[key] = value;
                        } else if (key === "due_month") {
                            value === "Month" ? inputs[key] = "" : inputs[key] = value;
                        } else if (key === "due_year") {
                            value === "Year" ? inputs[key] = "" : inputs[key] = value;
                        }
                    }

                    // ?How do I get the id? which element contains the id? form.dataset.id? ONly on edit renditions?
                    const id = e.target.closest("tr")

                    // inputs["due_month"] === "" || inputs["due_year"] === "" ?inputs["due_date"] = "No Due Date" : inputs["due_date"] = inputs["due_day"] + "/" + inputs["due_year"].substr(-2);

                    if (view.allValuesAreValid(inputs)) {
                        const modalLayer = document.querySelector("#modal_layer")
                        const formModal = document.querySelector("#form_modal")

                        console.log(inputs);
                        if (id) {
                            controller.handleAddTodo(id,inputs)

                        } else {
                            controller.handleAddTodo(inputs);
                            // handler(inputs)
                        }

                        modalLayer.style.display = "none"
                        formModal.style.display = "none";
                    }

                }

            })
        },
        bindMarkAsCompleteButton() {

        },
        bindModalBackground() {
            const modalLayer = document.querySelector("#items main div")
            const formModal = document.querySelector("#form_modal")
            modalLayer.addEventListener("click", e => {
                e.preventDefault();

                document.querySelector("form").reset()
                modalLayer.style.display = "none"
                formModal.style.display = "none"
            })
        },
        bindAddNewButton(handler) {
            const newButtonLink = document.querySelector("#items main label")

            newButtonLink.addEventListener("click", e => {
                e.preventDefault();

                handler()
            })

        },
        allValuesAreValid(inputs) {
            let isValid = true;

            let regexMinThreeChars = /(.*[a-z]){3}/i;
            let regexMinOneChar = /(.*[a-z]){1}/i;

            // Must have a title of at least 3 chars

            // Can I make a message here letting the user know what went wrong.
            inputs["title"].length > 3 ? isValid = true : isValid = false;

            return isValid;
        },

        bindDeleteButtons(handler) {
            const deleteButtons = document.querySelectorAll(".delete");

            deleteButtons.forEach(button => {
                button.addEventListener("click", e => {
                    e.preventDefault();

                    const id = +e.target.closest("tr").dataset.id;
                    handler(id);
                })
            })
        },
        bindViewAllTodosButton(handler) {
            const seeAllTodosSidebarButton = document.querySelector("#all_todos");

            seeAllTodosSidebarButton.addEventListener("click", e => {
                e.preventDefault();
                console.log(e.target);
                handler();
            })
        },
        bindViewByCompleteMonthButtons(handler) {
             const dateLinks = document.querySelectorAll("#completed_lists")

             dateLinks.forEach(link => {
                 link.addEventListener("click", event => {
                     const selectedDate = event.target.closest("dl").getAttribute("data-title")
                    console.log(selectedDate);
                    if (selectedDate) {
                        handler(selectedDate)
                    }
               })
             })

        },

        bindViewByCompletedButtons(handler) {
            const seeOnlyCompletedTasksButton = document.querySelector("#all_done_header");

            seeOnlyCompletedTasksButton.addEventListener("click", e => {
                e.preventDefault();

                let title = e.target.textContent;

                console.log(e.target);

                handler(title);
            })
        },

        bindViewByMonthButtons(handler) {
            const dateLinks = document.querySelectorAll("#all_lists")

             dateLinks.forEach(link => {
                 link.addEventListener("click", event => {
                     const selectedDate = event.target.closest("dl").getAttribute("data-title")
                    console.log(selectedDate);
                    if (selectedDate) {
                        handler(selectedDate)
                    }
               })
             })
        },

        bindEditTodoLinks(handler) {
            const editLink = document.querySelectorAll("tbody label");

            editLink.forEach(link => {
                link.addEventListener("click", e => {
                    e.preventDefault();

                    if (!e.target.getAttribute("for")) return

                    if (e.target.getAttribute("for").split("_")[0] === "item") {
                        const id = +e.target.getAttribute("for").replace(/[^0-9]/g,"");
                        console.log(id);
                        handler(id);
                    }
                })
            })

        },
        bindCheckboxStatus(handler) {
            document.querySelectorAll(".list_item").forEach(el => {
                el.addEventListener("click", e => {
                    e.preventDefault()

                    if (!e.target.getAttribute("for")) {

                        console.log(e.target.tagName);

                        const id = +e.target.closest("td").firstElementChild.id.replace(/[^0-9]/g,"")
                        if (e.target.closest("td").firstElementChild.checked) {
                            e.target.closest("td").firstElementChild.checked = false
                        } else {
                            e.target.closest("td").firstElementChild.checked = true
                        }

                        handler(id)
                    }
                })
            })
        },
        bindTodoChanged(callback) {
            this.onStateChange = callback;
        },

        removeTodoListElements() {
            let currentContainer = document.querySelector("tbody");

            for (let i = 0; i < currentContainer.children.length; i++) {
                currentContainer.removeChild(currentContainer.children[i]);
            }
        }
    }

    const controller = {
        init(Model) {
            this.model = Model;
            this.view = view;

            view.getHandlebarsTemplates();
            this.getAllTodosAndRender();
        },
        async getAllTodosAndRender() {
            model.todos = await model.getAllTodosFromDatabase();

            // modify the todos to add a due_date key with the date of when it is due.
            model.todos = this.addDueDatetoEachObject(model.todos)
            model.todos = this.addTodosByDateToEachObject(model.todos)

            console.log("All todos recieved :)");
            console.log(model.todos);
            this.renderTodos(model.todos);
        },

        addDueDateProperty(todos) {

        },
        handleDeleteTodo(id) {
            if (confirm(`Are you sure you want to delete this todo: ID ${id}?`)) {
                model.deleteTodo(id);
            }
        },
        handleAddTodo(todo) {
            this.model.addTodo(todo)
        },

        handleUpdateTodo(id, todo) {
            this.model.updateTodo(id, todo);
        },
        handleMarkAsCompleteInEditMode(id) {
            // update todo in database
            this.model.updateTodo(id)
            // ! Something wrong here related to CSS and table td input[type="checkbox"]:checked ~ label

            // FIND IT!
        },
        handleFormBackgroundClick() {

        },
        handleViewAllTodos() {
            controller.renderTodos(model.todos)
        },
        handleOnlyCompleted(title) {
            const onlyCompletedTasks = model.todos.filter(item => {
                return item.completed;
            })

            controller.renderCompletedTodos(onlyCompletedTasks,title)

        },
        // ! MAKE SURE TO COPY INTO HERE THE FINISHED SUITE
        renderCompletedTodos() {
            const results = model.todos.filter(el => el.completed)

            view.displayMainPage(results,"Completed")
            view.displaySidebar(results);

            view.bindAddNewButton(this.renderForm)
            view.bindDeleteButtons(this.handleDeleteTodo);
            view.bindEditTodoLinks(this.renderFormForUpdate)
            view.bindCheckboxStatus(this.renderCheckedBox)
            view.bindViewByMonthButtons(this.renderTodosByMonth)
            view.bindViewAllTodosButton(this.handleViewAllTodos)
            view.bindViewByCompletedButtons(this.renderCompletedTodos)
            view.bindViewByCompleteMonthButtons(this.renderCompletedTodosByMonth)
        },
        renderTodos(todos) {
            view.displayMainPage(todos,"All Todos")
            view.displaySidebar(todos)
            view.bindAddNewButton(this.renderForm)
            view.bindDeleteButtons(this.handleDeleteTodo);
            view.bindEditTodoLinks(this.renderFormForUpdate)
            view.bindCheckboxStatus(this.renderCheckedBox)
            view.bindViewByMonthButtons(this.renderTodosByMonth)
            view.bindViewAllTodosButton(this.handleViewAllTodos)
            view.bindViewByCompletedButtons(this.renderCompletedTodos)
            view.bindViewByCompleteMonthButtons(this.renderCompletedTodosByMonth)
        },
        renderTodosByMonth(monthChoice) {
            const filterByMonth = model.todos.filter(item => {
                return item.due_date === monthChoice
            })
            console.log(filterByMonth);
             controller.view.displayMainPage(filterByMonth,monthChoice);
             controller.view.displaySidebar(model.todos)
             view.bindAddNewButton(this.renderForm)
             view.bindDeleteButtons(this.handleDeleteTodo);
             view.bindEditTodoLinks(this.renderFormForUpdate)
             view.bindCheckboxStatus(this.renderCheckedBox)
             view.bindViewByMonthButtons(this.renderTodosByMonth)
             view.bindViewAllTodosButton(this.handleViewAllTodos)
             view.bindViewByCompletedButtons(this.renderCompletedTodos)
             view.bindViewByCompleteMonthButtons(this.renderCompletedTodosByMonth)
         },
         renderCompletedTodosByMonth(month) {
            const temp = model.todos.filter(el => el.completed);
            const results = temp.filter(el => el.due_date === month);

            controller.view.displayMainPage(results,month);
             controller.view.displaySidebar(results)
             view.bindAddNewButton(this.renderForm)
             view.bindDeleteButtons(this.handleDeleteTodo);
             view.bindEditTodoLinks(this.renderFormForUpdate)
             view.bindCheckboxStatus(this.renderCheckedBox)
             view.bindViewByMonthButtons(this.renderTodosByMonth)
             view.bindViewAllTodosButton(this.handleViewAllTodos)
             view.bindViewByCompletedButtons(this.renderCompletedTodos)
             view.bindViewByCompleteMonthButtons(this.renderCompletedTodosByMonth)
         },
        renderForm() {
            view.displayForm();
            view.bindModalBackground(this.handleFormBackgroundClick)
            view.bindMarkAsCompleteButton(this.handleMarkAsCompleteInEditMode);
            view.bindSaveButton(this.handleAddTodo)
        },
        async renderCheckedBox(id) {
           const todo  = await model.getTodo(id)
           console.log(todo.completed);

           if (todo.completed) {
               todo.completed = false
           } else if (todo.completed === false) {
               todo.completed = true
           }
           console.log(todo.title,todo.completed);
           await model.updateTodo(id, todo)
        },
        async renderFormForUpdate(id) {
            // get contact from database
            const todo = await model.getTodo(id);
            console.log(todo);
            // console.log(`${model.todos.title} (ID ${id}) has been successfully edited. :)`);
            // display Form
            view.displayForm(todo);
             // bindSaveButton
            view.bindSaveButton(this.handleUpdateTodo)
            // bindMarkAsCompleteButton
            view.bindMarkAsCompleteButton(this.handleUpdateTodo)
            // bindModalLayer with closing form
            view.bindModalBackground(this.handleFormBackgroundClick)
        },
        addTodosByDateToEachObject(todos) {
            let result = [];
            let doneTodosArrayOfObjects = todos.filter(el => el.completed)

            let todos_by_date = todos.reduce((acc,obj) => {
                acc[obj["due_date"]] ? acc[obj["due_date"]].push(1) : acc[obj["due_date"]] = [1]
                return acc;
            },{})

            let done_todos_by_date = doneTodosArrayOfObjects.reduce((acc,obj) => {
                acc[obj["due_date"]] ? acc[obj["due_date"]].push(1) : acc[obj["due_date"]] = [1]
                return acc;
            },{})

            let orderedByDate = Object.keys(todos_by_date).sort(function(a, b){
                var aa = a.split('/').reverse().join(),
                    bb = b.split('/').reverse().join();
                return aa < bb ? -1 : (aa > bb ? 1 : 0);
            }).reduce((obj,key) => {
                obj[key] = todos_by_date[key];
                return obj;
            },{});

            for (let i = 0; i < todos.length; i++) {
                let currentObj = todos[i];

                currentObj["todos_by_date"] = orderedByDate
                currentObj["done_todos_by_date"] = done_todos_by_date
                result.push(currentObj)
            }

            return result;
        },

        getDueDateAll(todos) {
            const newTodos = todos.reduce((acc,curr) => {
                let date;
                if (!curr.month || !curr.year) {
                    date = "No Due Date";
                    curr["due_date"] = date;
                    acc.push(curr)
                } else {
                    let month = curr.month;
                    let year = curr.year.substr(-2);
                    let date = `${month}/${year}`
                    curr["due_date"] = date;
                    acc.push(curr)
                }
                return acc
            },[])

            return newTodos
        },
        addDueDatetoEachObject(todos) {
            let result = [];

            for (let obj of todos) {

                if (obj.month === "" || obj.year === "") {
                    obj["due_date"] = "No Due Date"
                } else {
                    let month = obj.month;
                    let year = obj.year.substr(-2);
                    let date = `${month}/${year}`

                    obj["due_date"] = date;
                }
                result.push(obj)
            }

            return result
        },
        getCompletedTasks(todos) {
            const completedTodos =  todos.filter(item => item.completed);

            return this.getSortedDate(completedTodos);
        },
        getOnlyUncompleteTasks(todos) {
            const onlyIncompleteTasks = todos.filter(item => !item.completed)
            return this.getSortedDate(onlyIncompleteTasks);
        },
        getAllTasksAndSorted(todos) {
            return this.getSortedDate(todos);
        },
        getSortedDate(todos) {
            let unordered = todos.reduce((acc,curr) => {
                if (curr.month === "" || curr.year === "") {
                    return acc
                } else {
                    let month = curr.month;
                    let year = curr.year.substr(-2);
                    let date = `${month}/${year}`
                    console.log(month, year,date);
                    acc[date] ? acc[date].push(1) : acc[date] = [1];
                    console.log(acc);
                    return acc
                }
            },{})

            unordered["No Due Date"] = todos.filter(el => {
                return el.month === "" || el.year === ""
            })

            if (!unordered) return {};

            let orderedByDate = Object.keys(unordered).sort(function(a, b){
                var aa = a.split('/').reverse().join(),
                    bb = b.split('/').reverse().join();
                return aa < bb ? -1 : (aa > bb ? 1 : 0);
            }).reduce((obj,key) => {
                obj[key] = unordered[key];
                return obj;
            },{});

            return orderedByDate
        }
        ,
    }
    controller.init(model);


    let testButton = document.querySelector(".test")
    let test2Btn = document.querySelector(".test2");
    test2Btn.addEventListener("click", e => {
        e.preventDefault();
        console.log(model.todos);
    })

    testButton.addEventListener("click", (e) => {
        e.preventDefault();

        console.log(view.templates);
    })
})