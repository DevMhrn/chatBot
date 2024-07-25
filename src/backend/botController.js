const { GoogleGenerativeAI } = require("@google/generative-ai");
const sequelize = require('./database');
const Conversation = require('./Conversation');

const fetch = require('node-fetch');
require('dotenv').config();

// Sync the database
sequelize.sync();

// Access your API key as an environment variable
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

let conversation = [];
const functions = {
  get_Rooms: async ({ room_budget }) => {
    try {
      const url = 'https://bot9assignement.deno.dev/rooms';
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching rooms:', error);
      return { error: 'Failed to fetch rooms' };
    }
  },
  book_Room: async ({ name, room_type, price, nights, email, phone_number }) => {
    try {
      const url = 'https://bot9assignement.deno.dev/book';
      const bookingDetails = {
        roomId: 2, // Assuming roomId is fixed as 2 for demonstration purposes
        fullName: name,
        email: email,
        nights: nights,
        roomType: room_type,
        phoneNumber: phone_number,
        price: price
      };
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingDetails)
      });
      const data = await response.json();
      console.log('Room booked:', data);
      return data;
    } catch (error) {
      console.error('Error booking room:', error);
      return { error: 'Failed to book room' };
    }
  },
};

// Initialize the generative model
const Initialize = async () => [
    {
      systemPrompt: "Adhere to the instructions given in the system prompt and follow the instructions strictly."
        + "You are a hotel booking assistant. You are strictly prohibited from answering anything apart from the context of booking a room, showing rooms to the user, providing details of the room, and collecting the details like name, email, phone number, nights, and room type of the user to book the room."
        + "If in the middle of the conversation the user greets again, then you terminate the ongoing conversation and start the new conversation with greeting the user and asking how you can help them.\n"
        + "You are a hotel assistant. Be polite and helpful to the user whenever there is a person asking for something."
        + "Firstly, whenever there is a person asking for something, greet them and ask what you can do for them or how you can help them."
        + "You are a hotel booking assistant. You can book hotel rooms, show rooms to users according to their requirements, and provide the details of the rooms to them."
        + "When a person is asking about booking a room, do not proceed further without getting the details. Ask the user to fill in the details one by one, like name, room type, price, nights, email, phone number, etc.,these are must questions to be asked and then call the book_room function to book the room and generate the booking ID."
        + "When a person is asking anything apart from the context of booking a room or showing rooms, respond with an apology that you can only book rooms or show rooms to them."
        + "For every line in the response, you should add a newline (\\n) to make it more readable and understandable for the user."
        + "The keywords should be **bold** in the response to make it more understandable for the user."
        + "You are supposed to remember the details of the conversation, like if you ask about the user's name, you should be able to answer the name and store it in the memory. The same goes for the other details like room type, price, nights, email, phone number, etc."
        + "When the user asks or requests to book a room, you should not proceed further without asking the details of the user, like name, room type, price, nights, email, phone number, and remember the details which will be used to book the room."
        + "Do not assume the details of the user. Always ask the user to provide the details like name, room type, price, nights, email, phone number, etc., and then proceed further to book the room. Even if the user is not providing the details, keep asking the user to provide the details"
        + "When the user is requesting in Hindi language, then perform all the actions, function calls, and setting values in memory but respond back in Hindi language."
        + "When the user has provided all the details to book a room after the must ask questions details like name , phone , email, nights , strictly give a summary of all the details from room type to number of nights with the key words highlighted in **bold**, then calculate the total price of the room correctly and ask the user to confirm the booking."
        +" Adhere to strictly to the rule that you have to correctly calculate the total price of the room by multiplying the price of the room by getting from the get_room function corresponding to the room type with the number of nights the user wants to stay in the room. and store it in the memory to use it later."
    }
  ];
  

const generativeModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction: Initialize(),
  tools: {
    functionDeclarations: [
      {
        name: "book_Room",
        parameters: {
          type: "object",
          description: "This function will take the details of the user to book a room, by asking for the details one by one and call the book_room function to book the room.",
          properties: { 
            name: {
              type: "string",
              description: "Set the name of the user, when the user provides the name by asking the use about the name of the user.",
            },
            room_type: {
              type: "string",
              description: "Set the type of the room, when the user provides the room_type, by asking the type of the room i.e Suite, Deluxe, Executive or Family room etc.",
            },
            price: {
              type: "number",
              description: "Set the price of the room, when the user asks to book the room set the price of the room corresponding to the room type",
            },
            nights: {
              type: "number",
              description: " set the number of nights the user wants to stay in the room , when the user provides the number of nights to stay ",
            },
            email: {
              type: "string",
              description: "Set the email of the user, when user provides the email , set the email of the user for the confirmation of the booking by asking the user by providing the email.",
            },
            phone_number: {
              type: "number",
              description: "Set the phone number of the user, when the user provides the email, set the phone number of the user for the confirmation of the booking by asking the user by providing the phone number.",
            },
          },
          required: ["name", "room_type", "price", "nights", "email", "phone_number"],
        },
      },
      {
        name: "get_Rooms",
        parameters: {
          type: "object",
          description: "This function will get the list of available room according to the price range provided by the user or If the use wants to see all the rooms , by getting the details from get_rooms function",
          properties: {
            room_budget: {
              type: "number", // Change type to string since room is treated as a string
              description: "This will filter the rooms according to the price range provided by the user.",
            },
          },
          required: ["room_budget"],
        },
      },
    ],
  },
});

// Main async function to run the script
const sendMessageToGemini = async (message) => {
  let temp = [];
  const chat = generativeModel.startChat();

  const saveConversation = async (role, content) => {
    await Conversation.create({ role, content });
  };

  const processResponse = async (message) => {
    conversation.push({ role: 'user', content: message });
    await saveConversation('user', message);

    try {
      const result = await chat.sendMessage(conversation.map(m => m.content).join('\n'));
      const responseText = result.response.text();

      conversation.push({ role: 'system', content: responseText });
      await saveConversation('system', responseText);

      console.log('Response:', responseText);
      if (responseText) {
        temp.push(responseText);
      }
      const functionCalls = result.response.functionCalls();

      if (functionCalls) {
        const call = functionCalls[0];
        const apiResponse = await functions[call.name](call.args);

        conversation.push({ role: 'function', content: JSON.stringify(apiResponse) });
        await saveConversation('function', JSON.stringify(apiResponse));

        const functionResponse = {
          functionResponse: {
            name: call.name,
            response: apiResponse,
          },
        };

        const result2 = await chat.sendMessage([JSON.stringify(functionResponse)]);
        const finalResponseText = result2.response.text();

        conversation.push({ role: 'system', content: finalResponseText });
        console.log('Final response:', finalResponseText);
        await saveConversation('system', finalResponseText);
        temp.push(finalResponseText);
      }
    } catch (error) {
      console.error('Error in main function:', error);
    }
  };

  await processResponse(message);

  return temp;
};

// Example usage
// sendMessageToGemini("I want to book a room").then(console.log).catch(console.error);

exports.sendMessageToGemini = sendMessageToGemini;
