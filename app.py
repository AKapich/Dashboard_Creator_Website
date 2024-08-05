from flask import Flask, render_template, request, jsonify
from statsbombpy import sb
import matplotlib.pyplot as plt
import io
import base64

from get_viz import viz_dict

app = Flask(__name__)

# Euro matches
matches = sb.matches(competition_id=55, season_id=282)
match_dict = {home+' - '+away: match_id
                 for match_id, home, away
                 in zip(matches['match_id'], matches['home_team'], matches['away_team'])}

# Charts available
side_charts = ["None", "Passing Network", "Passing Sonars", "Shot xG", "Pass Heatmap", "xT Heatmap", "Pressure Heatmap",  "Action Territories",
               'Progressive Passes', "Passes to Final 3rd", "Passes to Penalty Area"]
middle_charts = ["None", "Overview", 'xT Momentum', 'xG Flow', "Voronoi Diagram", 'xT by Players', "Shot Types"]



# Route to render the main page
@app.route('/')
def index():
    return render_template(
        'index.html',
        match_dict=match_dict,
        side_charts=side_charts,
        middle_charts=middle_charts,
        options=side_charts
    )


@app.route('/generate_plot', methods=['POST'])
def generate_plot():
    try:
        data = request.json
        plot_type = data.get('plot_type')

        match_id = data.get('match_id')
        if not match_id:
            raise ValueError("No match ID provided")
        
        # match_data = matches.query('match_id == @match_id').iloc[0]
        match_data = matches[matches['match_id']==int(match_id)].iloc[0]
        home_team = match_data['home_team']
        away_team = match_data['away_team']
        
        img = io.BytesIO()
        fig, ax = plt.subplots(figsize=(13, 8), tight_layout=True)
        fig.set_facecolor('#0e1117')
        ax.patch.set_facecolor('#0e1117')
        ax.axis('off')

        # home_team='Netherlands'
        viz_dict[plot_type](match_id=match_id, team=home_team, ax=ax)

        plt.savefig(img, format='png')
        img.seek(0)
        plt.close()
        img_data = base64.b64encode(img.getvalue()).decode('utf-8')
        return jsonify({'img_data': img_data})
    
    except Exception as e:
        print(f"Error occurred: {e}")
        return jsonify({'error': 'An error occurred while generating the plot'}), 500


if __name__ == '__main__':
    app.run(debug=True)
