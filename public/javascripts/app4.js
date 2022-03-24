
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

            async deleteTodo(id) {
                return fetch(`api/todos/${id}`, {
                    method: "DELETE",
                }).then(() => {
                    console.log(`The todo with an ID of ${id} has been deleted. :)`);

                    model.todos = model.todos.filter(el => el.id !== id)
                    model.todos = controller.addDueDatetoEachObject(model.todos)
                    model.todos = controller.addTodosByDateToEachObject(model.todos);
                    model.todos = view.sortArrayByCompleteness(model.todos);

                    controller.renderTodos(model.todos,view.current_section.title,view.current_section.title)
                }).catch(() => {
                    `An error occured while trying to delete the todo. Please try again.`
                })
            },

            async addTodo(todo) {
                todo = JSON.stringify(todo);

                return fetch(`api/todos`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: todo,
                }).then(res => res.json()).then(data => {
                    todo = data;
                    console.log(`The todo titled: "${data.title}" with an ID of ${data.id}), was added`);

                }).catch(() => {
                    `An error occured while attempting to add the todo. Please try again. :(`
                })
            },

            async updateTodo(id, todo) {
                console.log(todo,id);
                delete todo.due_date;
                delete todo.id;
                todo = JSON.stringify(todo);

                try {
                    console.log(todo);
                    await fetch(`api/todos/${id}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: todo,
                    }).then(res => res.json()).then(data => {
                        todo = JSON.parse(todo);

                        console.log(`The todo with title ${data.title} with ID of ${data.id} was updated. :)`);

                        console.log(model.todos,view.current_section,todo,data);
                    })
                } catch (error) {
                    throw new Error(`An error occured while attempting to update your todo.`);
                }
            },

            async myfetchTodos(targetEndPoint, payload) {
                const res = await fetch(targetEndPoint,payload);

                if (!res.ok) {
                    throw new Error(`An HTTP ${res.status} error occured. :(`)
                }

                return res.json();
            },
        }
    })()

    const view = {
        templates: {},
        current_section: {
            title: "All Todos",
            data: 0,
            activeSidebar: null
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
            console.log(view.current_section,todosArrayOfObjectsWithDueDatesAndTodosDates,title,model.todos);
            model.todos = controller.addDueDatetoEachObject(model.todos)
            model.todos = controller.addTodosByDateToEachObject(model.todos)
            model.todos = view.sortArrayByCompleteness(model.todos)
            if (view.current_section.title === "All Todos") {
                title = view.current_section.title
            } else if (view.current_section.title === "Completed") {
                title = view.current_section.title
            } else if ( view.current_section.title.split(".")[0] === "completed" ) {
                console.log("displayMainPage Before filter", view.current_section,model.todos[0].todos_by_date[view.current_section.title.split(".")[1]]);
                title = view.current_section.title.split(".")[1]
            } else {
                console.log("displayMainPage Before filter", view.current_section,model.todos[0].todos_by_date[view.current_section.title.split(".")[1]]);
                title = view.current_section.title.split(".")[1]
            }

            console.log("displayMainPage AFTER filter",title, view.current_section,model.todos);

            let theBody = document.querySelector("body");
            theBody.innerHTML = "";
            theBody.innerHTML = this.templates.main_template();

            let currentContainer = document.querySelector("tbody");
            const mainPageHeader = document.querySelector("#items").firstElementChild

            // set current section state
            view.current_section.data = view.current_section.currentMainPageSelection.length;

            //display main page header
            let currentCount = {data: view.current_section.currentMainPageSelection.length,title:title}
            mainPageHeader.innerHTML = "";
            mainPageHeader.innerHTML = this.templates.title_template({current_section: currentCount})

            // display main page todos
            let currentView = view.current_section.currentMainPageSelection
            currentContainer.innerHTML = "";
            currentContainer.innerHTML = this.templates.list_template( {selected: currentView})
        },
        displaySidebar(todosArrayOfObjectsWithDueDatesAndTodosDates,selectedSidebarItem = "") {
            const sidebarAllTodosHeader = document.querySelector("#all_todos")
            //dispplay sidebar header todos
            sidebarAllTodosHeader.innerHTML = "";
            sidebarAllTodosHeader.innerHTML = this.templates.all_todos_template({todos: model.todos})

            // display sidebar todos by date
            let todosByDate = controller.addTodosByDateToEachObject(model.todos)
            if (!todosByDate[0]) {
                todosByDate = [{todos_by_date:{}}];
            } else {
                const sidebarAllListItems = document.querySelector("#all_lists");
                sidebarAllListItems.innerHTML = "";
                sidebarAllListItems.innerHTML = this.templates.all_list_template({todos_by_date: todosByDate[0].todos_by_date})
            }
            // display sidebar todos completed
            let doneTodosByDate = controller.addTodosByDateToEachObject(model.todos)
            if (!doneTodosByDate[0]) {
                doneTodosByDate = [{done_todos_by_date:{}}];
            }
            const sidebarCompletedTasksByMonth = document.querySelector("#completed_lists");
            sidebarCompletedTasksByMonth.innerHTML = "";
            sidebarCompletedTasksByMonth.innerHTML = this.templates.completed_list_template({done_todos_by_date: doneTodosByDate[0].done_todos_by_date})

            let completedCount = model.todos.filter(el => el.completed);
            const completedSidebarHeader = document.querySelector("#completed_todos");
            completedSidebarHeader.innerHTML = "";
            completedSidebarHeader.innerHTML = this.templates.completed_todos_template({done: completedCount})
            console.log("displaySidebar", selectedSidebarItem,model.todos,view.current_section);

            if (selectedSidebarItem) {
                if (view.current_section.title === "All Todos") {
                    selectedSidebarItem = "All Todos";
                } else if (view.current_section.title === "Completed") {
                    selectedSidebarItem = "Completed";
                } else if (view.current_section.title === "No Due Date") {
                    selectedSidebarItem = "No Due Date"
                } else {
                    var sidebarSectionHeader = selectedSidebarItem.split(".")[0];
                    var selectedDate = selectedSidebarItem.split(".")[1];
                }
                var activeElement;

                const sidebarItems = document.querySelectorAll("#sidebar header,#sidebar dl")
                sidebarItems.forEach(el => {
                    el.classList.remove("active");
                })
                if (selectedSidebarItem === "All Todos") {
                    activeElement = [...document.querySelectorAll("header")][0];
                    activeElement.classList.add("active");
                } else if (selectedSidebarItem === "Completed") {
                    activeElement = [...document.querySelectorAll("header")][1];
                    activeElement.classList.add("active");
                } else if ( sidebarSectionHeader === "all") {
                    activeElement = [...document.querySelectorAll("#all_lists dl")].filter(el => {
                        return el.dataset.title === selectedDate
                    })[0];
                    activeElement.classList.add("active");

                } else if (sidebarSectionHeader === "completed") {
                    activeElement = [...document.querySelectorAll("#completed_lists dl")].filter(el => {
                        return el.dataset.title === selectedDate;
                    })[0];
                    activeElement.classList.add("active");
                }
            }
        },
        displayForm(todo) {
            const modalLayer = document.querySelector("#modal_layer")
            const formModal = document.querySelector("#form_modal")
            const form = document.querySelector("form")
            form.reset();

            if (todo) {
                modalLayer.style.display = "block"
                formModal.style.display = "block";

                document.querySelector("#title").setAttribute("value",todo.title)
                document.querySelector(`[name="description"]`).value = todo.description;
                if (todo.year) {
                    document.querySelector("#due_year").value = todo.year
                }
                if (todo.month) {
                    document.querySelector("#due_month").value = todo.month;
                }
                if (todo.day) {
                    document.querySelector("#due_day").value = todo.day
                }
                document.querySelector(`[type="submit"]`).classList.add(`${todo.id}`)
            } else {
                modalLayer.style.display = "block"
                formModal.style.display = "block";
            }
        },
        bindSaveButton(handler, title) {
            const form = document.querySelector("form")

            form.addEventListener("click", e => {
                e.preventDefault();

                if (e.target.tagName === "h2") form.reset();
                if (e.target.getAttribute("type") === "submit") {
                    console.log(e.target,e.currentTarget);
                    const inputs = {};
                    //  A little messy putting validation in here, but I have to get the data out of the object, so I might as well do a little validation.
                    const id = +e.target.getAttribute("class")
                    console.log(id);
                    const formData = new FormData(form)
                    for (var [key,value] of formData.entries()) {
                        if (key === "description") {
                            key === "description" && value.length > 1 ? inputs[key] = value : inputs[key] = "";
                        } else if (key === "title") {
                            if (key === "title" && value.length > 3) {
                                inputs[key] = value
                            } else {
                                alert(`Each entry must include a title.`) ;
                                const modalLayer = document.querySelector("#modal_layer")
                                const formModal = document.querySelector("#form_modal")
                                modalLayer.style.display = "none"
                                formModal.style.display = "none";
                                console.log("the Return Statement");
                                form.reset();
                                return;
                            }
                        } else if (key === "due_day") {
                            key === "due_day" && value === "Day" ? inputs["day"] = "" : inputs["day"] = value;
                        } else if (key === "due_month") {
                            value === "Month" ? inputs["month"] = "00" : inputs["month"] = value;
                        } else if (key === "due_year") {
                            value === "Year" ? inputs["year"] = "0000" : inputs["year"] = value;
                        }
                    }
                    if (id)  {
                         inputs["completed"] = model.todos.filter(obj => obj.id === id)[0].completed;
                    }

                    if (view.allValuesAreValid(inputs)) {
                        const modalLayer = document.querySelector("#modal_layer")
                        const formModal = document.querySelector("#form_modal")

                        // update page
                        const currentItemsList = [...document.querySelectorAll("tr")]
                        const currentItemsId = currentItemsList.map(el => el.dataset.id)

                        let result = [];

                        currentItemsId.forEach(elID => {
                            result.push(model.todos.filter(el => +el.id === + elID)[0])
                        })

                        if (inputs.month !== "" && inputs.year !== "") {
                            inputs.due_date = inputs.month + "/" + inputs.year.substr(-2);
                        }

                        console.log("bindSave",id, result, inputs, model.todos,view.current_section,currentItemsId);
                        if (!id) {
                            // update database
                            if (!title) title = this.current_section.title;
                            handler(result,title,inputs)
                        } else {
                            inputs.id = id;
                            if (!("due_date" in inputs)) {
                                inputs.due_date = "No Due Date";
                            }

                            this.objectReplacer(model.todos,inputs)
                            this.objectReplacer(view.current_section.currentMainPageSelection,inputs)

                            console.log("bindSave LAST",id, result, inputs, model.todos,view.current_section,currentItemsId);

                            handler(result,title, inputs);

                        }

                        modalLayer.style.display = "none"
                        formModal.style.display = "none";

                    } else {
                        const modalLayer = document.querySelector("#modal_layer")
                        const formModal = document.querySelector("#form_modal")
                        modalLayer.style.display = "none"
                        formModal.style.display = "none";

                    }
                }
            })
        },


        objectReplacer(arrayOfObjects, newObject) {
            let index = arrayOfObjects.findIndex(obj => obj.id === newObject.id);

            if (index === -1) {
                arrayOfObjects.push(newObject);
            } else {
                arrayOfObjects[index] = newObject;
            }
        },

        bindModalBackground() {
            const modalLayer = document.querySelector("#items main div")
            const formModal = document.querySelector("#form_modal")
            const form = document.querySelector("form")
            modalLayer.addEventListener("click", () => {
                form.reset()
                modalLayer.style.display = "none"
                formModal.style.display = "none"
            })
        },
        bindAddNewButton(handler) {
            const newButtonLink = document.querySelector("#items main label")
            const form = document.querySelector("form")
            form.reset();

                newButtonLink.addEventListener("click", () => {
                    handler();
                })
        },
        allValuesAreValid(inputs) {
            let isValid = true;
            inputs["title"].length > 3 ? isValid = true : isValid = false;

            return isValid;
        },
        bindDeleteButtons(handler) {
            const deleteButtons = document.querySelectorAll(".delete");

            deleteButtons.forEach(button => {
                button.addEventListener("click", e => {
                    e.preventDefault();

                    const id = +e.target.closest("tr").dataset.id;

                    view.current_section.currentMainPageSelection = view.current_section.currentMainPageSelection.filter(obj => {
                        return obj.id !== id
                    })
                    console.log(id, model.todos,view.current_section);

                    handler(id);
                })
            })
        },

        bindEditTodoLinks(handler,title) {
            const editLink = document.querySelectorAll("tbody label");

            editLink.forEach(link => {
                link.addEventListener("click", e => {
                    e.preventDefault();
                    e.stopPropagation();

                    if (!e.target.getAttribute("for")) return
                    if (e.target.getAttribute("for").split("_")[0] === "item") {

                        const id = +e.target.getAttribute("for").replace(/[^0-9]/g,"");

                        handler(id,title);
                    }
                })
            })
        },
        bindCheckboxStatus(handler) {
            document.querySelectorAll(".list_item").forEach(el => {
                el.addEventListener("click", e => {

                    if (!e.target.getAttribute("for")) {
                        let id = +e.target.closest("td").firstElementChild.id.replace(/[^0-9]/g,"")

                        e.target.closest("td").firstElementChild.checked = !e.target.closest("td").firstElementChild.checked

                        const todo = model.todos.filter(el => el.id === id)[0]

                        todo.completed = !todo.completed;

                        const currentItemsList = [...document.querySelectorAll("tr")]
                        const currentItemsId = currentItemsList.map(el => el.dataset.id)

                        let result = [];

                        currentItemsId.forEach(elID => {
                            result.push(model.todos.filter(el => +el.id === + elID)[0])
                        })

                        // controller.getCurrentSelection();

                        console.log(result, view.current_section,todo, model.todos);

                        handler(result,view.current_section.activeSidebar, todo);
                    }
                })
            })
        },

        sortArrayByCompleteness(arr) {
            let result = arr.sort((a,b) => {
                var aa = a.due_date.split('/').reverse().join(),
                bb = b.due_date.split('/').reverse().join();

                return  (a.completed === b.completed) ? aa < bb ? -1 : (aa > bb ? 1 : 0) : a.completed ? 1 : -1
            })

            return result;
        },
        bindSidebarToggleActiveAndRender(handler) {
            const sidebarItems = document.querySelectorAll("#sidebar header,#sidebar dl")

            sidebarItems.forEach((item,idx) => {
                item.addEventListener("click", (event) => {
                    event.stopPropagation()
                //    HIde all sidebar activity.
                    sidebarItems.forEach((el,index) => {
                        if (index !== idx)  {
                            el.classList.remove("active");
                        }
                    })

                    let currentSelection;
                    let currentElement;
                    if (event.target.querySelector("dt") && event.target.querySelector("dt").innerHTML[0] !== "<") {
                        currentSelection = event.target.querySelector("dt").innerHTML;
                        currentElement =  event.target.closest("header")
                    } else if (event.target.querySelector("dt") && event.target.querySelector("dt").innerHTML.slice(6,11)[0] !== "N") {
                        currentSelection = event.target.querySelector("dt").innerHTML.slice(6,11);
                        currentElement =  event.target.closest("dl")
                    } else if (event.target.textContent[0] === "A" || event.target.textContent[0] === "C") {
                        currentSelection = event.target.textContent
                        currentElement = event.target.closest("header")
                    } else {
                        currentSelection = event.target.textContent.trim()
                        currentElement = event.target.closest("dl")
                    }
                    let selectedTodos;
                    let sidebarItemIdentifier;
                    console.log(currentElement,currentSelection,model.todos);

                    if (currentElement.tagName.includes("DL")) {
                        // These are the dates but they need to be further distinguished into all or completed hence sidebarItemIdentifier.
                        console.log(currentElement.dataset.total);

                        if (currentElement.closest("article").id === "all_lists" ) {
                            selectedTodos = view.filterArrayByDate(model.todos,currentSelection);
                            sidebarItemIdentifier = "all." + currentSelection;
                            this.current_section.title = "all." + currentElement.dataset.title
                            console.log(sidebarItemIdentifier, JSON.stringify(view.current_section), model.todos[0].todos_by_date[currentSelection].length - 1);
                        } else {
                            let temp = view.getOnlyCompletedTodos()
                            selectedTodos = view.filterArrayByDate(temp,currentSelection)
                            sidebarItemIdentifier = "completed." + currentSelection
                            this.current_section.title = "completed." + currentElement.dataset.title
                        }
                        // the headers have to be divided into either group
                    } else if (currentElement.closest("header").dataset.title === "Completed") {
                        view.current_section.title = currentSelection;
                        selectedTodos = view.getOnlyCompletedTodos();
                        sidebarItemIdentifier = currentSelection;
                    } else {
                        view.current_section.title = currentSelection
                        selectedTodos = model.todos;
                        sidebarItemIdentifier = currentSelection;
                    }


                    console.log(view.current_section,model.todos,currentElement,currentSelection);

                    controller.getCurrentSelection();

                    console.log("bindSidebar", selectedTodos,currentElement,currentSelection,model.todos,view.current_section);
                    handler(selectedTodos,currentSelection,sidebarItemIdentifier)
                },true)
            })
        },
        filterArrayByDate(array, date) {
            let result = array.filter(el => {
                return el.due_date === date;
            })
            return result;
        },
        getOnlyCompletedTodos() {
            return model.todos.filter(el => {
                return el.completed;
            })
        },
        bindMarkAsCompleteButton(handler,id) {
            let button = document.querySelector("button")
            button.addEventListener("click", e => {
                e.preventDefault();

                if (!e.target.getAttribute("for")) {
                    if (!id) {

                        return handler();
                    } else {
                        var todo = model.todos.filter(el => el.id === id)[0]
                    }
                    todo.completed = !todo.completed;

                    const currentItemsList = [...document.querySelectorAll("tr")]
                    const currentItemsId = currentItemsList.map(el => el.dataset.id)

                    let result = [];

                    currentItemsId.forEach(elID => {
                        result.push(model.todos.filter(el => +el.id === + elID)[0])
                    })
                    this.objectReplacer(view.current_section.currentMainPageSelection,todo)
                    this.objectReplacer(model.todos,todo)

                    view.current_section.currentMainPageSelection = view.sortArrayByCompleteness(view.current_section.currentMainPageSelection)
                    console.log(todo,result, model.todos, view.current_section);

                    handler(result,title, todo);
                }
            })
        }
    }

    const controller = {
        init(Model) {
            this.model = Model;
            this.view = view;

            view.getHandlebarsTemplates();
            this.getAllTodosAndRender();
        },

        addDoneAndTodosLength(arr) {
            let result ;

            let todosLength = model.todos.length;
            let selectedLength = arr.length;

            arr.forEach(obj => {
                obj.selected = selectedLength;
                obj.todos = todosLength;
                result.push(obj)
            })

            return result
        },
        async getAllTodosAndRender() {
            model.todos = await model.getAllTodosFromDatabase();
            // modify each todos object to add a due_date key with the date of when it is due.
            let results = this.addDueDatetoEachObject(model.todos)
            results = this.addTodosByDateToEachObject(results)
            results = view.sortArrayByCompleteness(results);

            view.current_section.currentMainPageSelection = model.todos;
            console.log("All todos recieved :)");
            this.renderTodos(results,"All Todos","All Todos");
        },
        async getAllTodos() {
            let result = await model.getAllTodosFromDatabase();

            // result = this.addDueDatetoEachObject(result)
            // result = this.addTodosByDateToEachObject(result)
            // result = view.sortArrayByCompleteness(result)

            model.todos = result;
            console.log(model.todos.view.current_section);
        },
        handleDeleteTodo(id) {
            if (confirm(`Are you sure you want to delete this todo: ID ${id}?`)) {
                model.deleteTodo(id);
            }
        },
        handleMarkAsCompleteAddNew() {
            alert(`Sorry. It is not possible to mark a new todo as complete. It seems someone is trying to cheat. :( `)
            document.querySelector("#items main div").style.dislpay = "none";
            document.querySelector("#form_modal").style.display = "none";
            document.querySelector("#modal_layer").style.display = "none";
        },
        renderTodos( title ) {


            console.log("renderTodos", title, view.current_section,model.todos);


            view.displayMainPage(view.current_section.currentMainPageSelection,title)
            view.displaySidebar(view.current_section.currentMainPageSelection,view.current_section.title)

            // Main Page
            view.bindAddNewButton(controller.renderForm,title)
            view.bindDeleteButtons(controller.handleDeleteTodo);
            view.bindEditTodoLinks(controller.renderFormForUpdate,title)
            view.bindCheckboxStatus(controller.renderCheckedBox,title)
            // Sidebar
            view.bindSidebarToggleActiveAndRender(controller.renderTodos)
        },
        renderForm() {
            view.displayForm();
            view.bindModalBackground(controller.handleFormBackgroundClick)
            view.bindMarkAsCompleteButton(controller.handleMarkAsCompleteAddNew);
            view.bindSaveButton(controller.renderCheckedBox)
        },
        renderCheckedBox(todos,title, todo) {
            // update database todo
            console.log(todo,model.todos,view.current_section);
            if (!todo.id) {
                model.addTodo(todo).then(() => {
                    console.log(todo,model.todos,view.current_section);
                    controller.getAllTodos();

                    model.todos = controller.addDueDatetoEachObject(model.todos)
                    model.todos = controller.addTodosByDateToEachObject(model.todos);
                    model.todos = view.sortArrayByCompleteness(model.todos);
                    controller.getCurrentSelection();

                    controller.renderTodos(model.todos,view.current_section.title);
                })
            } else {
                model.updateTodo(todo.id,todo).then(() => {

                    console.log(todo,model.todos,view.current_section);
                    controller.getAllTodos();

                    // model.todos = controller.addDueDatetoEachObject(model.todos)
                    // model.todos = controller.addTodosByDateToEachObject(model.todos);
                    // model.todos = view.sortArrayByCompleteness(model.todos);
                    controller.getCurrentSelection();

                    controller.renderTodos(model.todos,view.current_section.title);
                })
            }
        },
        renderFormForUpdate(id,title) {
            // get contact from database
            const todo = model.todos.filter(el => el.id === id)[0];

            console.log(`${todo.title} (ID ${todo.id}) is ready to be edited. :)`);
            // display Form
            view.displayForm(todo);
             // bindSaveButton
            view.bindSaveButton(controller.renderCheckedBox,title)
            // bindMarkAsCompleteButton
            view.bindMarkAsCompleteButton(controller.renderCheckedBox,id)
            // bindModalLayer with closing form
            view.bindModalBackground(controller.handleFormBackgroundClick)
        },
        addTodosByDateToEachObject(todos) {
            let result = [];
            let doneTodosArrayOfObjects = model.todos.filter(el => el.completed)
            let todos_by_date = model.todos.reduce((acc,obj) => {
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

            let doneOrderedByDate = Object.keys(done_todos_by_date).sort(function(a, b){
                var aa = a.split('/').reverse().join(),
                    bb = b.split('/').reverse().join();
                return aa < bb ? -1 : (aa > bb ? 1 : 0);
            }).reduce((obj,key) => {
                obj[key] = done_todos_by_date[key];
                return obj;
            },{});

            for (let i = 0; i < todos.length; i++) {
                let currentObj = todos[i];

                currentObj["todos_by_date"] = orderedByDate
                currentObj["done_todos_by_date"] = doneOrderedByDate
                result.push(currentObj)
            }

            return result
        },
        addDueDatetoEachObject(todos) {
            let result = [];

            for (let obj of todos) {
                if (!obj.month || !obj.year ) {
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
        handleFormBackgroundClick() {
            const modalLayer = document.querySelector("#modal_layer")
            const formModal = document.querySelector("#form_modal")
            modalLayer.style.display = "none"
            formModal.style.display = "none";
        },
        getCurrentSelection() {
            if (view.current_section.title === "All Todos") {
                view.current_section.currentMainPageSelection = model.todos

            } else if (view.current_section.title === "Completed") {
                console.log(view.current_section.currentMainPageSelection)
                view.current_section.currentMainPageSelection = model.todos.filter(obj => obj.completed);
            } else if ( view.current_section.title.split(".")[0] === "completed" ) {
                console.log("displayMainPage Before filter", view.current_section,model.todos[0].todos_by_date[view.current_section.title.split(".")[1]]);
                let temp = model.todos.filter(obj => obj.completed);
                let result = temp.filter(obj => obj.due_date === view.current_section.title.split(".")[1])
                if (result.length > 0) {
                    view.current_section.currentMainPageSelection = result;
                } else {
                    view.current_section.title = "All Todos";
                    view.current_section.currentMainPageSelection = model.todos;
                    view.current_section.data = model.todos.length;
                }
            } else {
                console.log("displayMainPage Before filter", view.current_section,model.todos[0].todos_by_date[view.current_section.title.split(".")[1]]);
                let result = model.todos.filter(el => el.due_date === view.current_section.title.split(".")[1])
                if (result.length > 0) {
                    view.current_section.currentMainPageSelection = result;
                } else {
                    view.current_section.title = "All Todos";
                    view.current_section.currentMainPageSelection = model.todos;
                    view.current_section.data = model.todos.length;
                }
            }


        }
    }
    controller.init(model);
})