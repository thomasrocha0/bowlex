## Overview
The games page should be where game creation, series creation, and game management live. 

### UI
The top right should contain a "Create Series" and "Add Game" button. The "Add Game" button should generate a modal with 10 frame inputs appear horizontally that appear like a normal bowling frame would (two boxes for each throw and a box for the score for that frame). the bottom right should have a "Submit" button that adds the game to the profile. The "Create Series" button spawns a modal with 3 game inputs stacked vertically. The user can submit the series to their profile and all 3 individual games will be added.

The main portion of the games screen will be a table showing games. 3 pieces of data will be shown: the game scorecard, the score, and the date of the game. The table will have sorting options that will be based on high score, low score, most recent, and least recent.

### Functionality
When adding games, frame-by-frame validation should be used as the user enters their data. Display an error if a frame has both inputs filled, but it is invalid. Prevent the user from submitting a game if the game is not valid. The only inputs should be 0-9, /, and X to represent a scorecard. Make conversions to full numerical values when going to submit since the database expects 0-10 format for all frame inputs.

The table component should be scrollable. All games should appear vertically stacked. 

### Implementation details
Create a frame component that can be variable in size. Create an input and a display version where both should have variable size. Create a game input component and game display component that uses the frame verisons. Keep the stylings for the frame and game components separate.
