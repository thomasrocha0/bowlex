## Social Screen
At the very top should be a search bar to find new users. 

Below the search bar, there will be a Friends table that lists all friends. There should be two tabs: "Friends" and "Pending". The "Friends" tab should show all accepted freinds. The "Pending" tab should be horizontally split into outgoing and incoming pending requests. Each row should show a friends username. The tabs should be above the table on the left. Above the table on the right should be a search bar to filter whats shown in the table.

## Functionality
Create a friend row component. it should accept a user's data. When the row is clicked, a modal should appear that lets the user manage this user's status. If this is a friend, the user as the option to remove as friend or block. if its pending, they can block or accept the user as a friend. if they are blocked, the user can unblock them. If they are none of these, the user can choose to send an invite or block them. decouple the row component and the corresponding functionality when clicked so that the functionality is passed in as a parameter.

The table should take a collection of user data and a mode as an input. It should construct the row components for each user with the proper functionality. 

The tabs and search bars will filter which users are rendered in the table. 

The new user search bar will show users whose username match the search filter. These should be the same row component as above. 