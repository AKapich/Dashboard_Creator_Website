from flask import Flask, render_template, request, jsonify
from statsbombpy import sb
import matplotlib.pyplot as plt
import io
import base64
from PIL import Image
import json
import threading
import matplotlib
matplotlib.use('Agg')

from get_viz import viz_dict
from auxiliary import country_colors

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
    )


@app.route('/generate_plot', methods=['POST'])
def generate_plot():
    with threading.Lock():
        try:
            data = request.json
            plot_type = data.get('plot_type')

            match_id = data.get('match_id')
            if not match_id:
                raise ValueError("No match ID provided")
            column = int(data.get('column', 1))
            
            match_data = matches[matches['match_id']==int(match_id)].iloc[0]
            home_team = match_data['home_team']
            away_team = match_data['away_team']
            
            img = io.BytesIO()
            fig, ax = plt.subplots(figsize=(13, 8), tight_layout=True)
            fig.set_facecolor('#0e1117')
            ax.patch.set_facecolor('#0e1117')
            ax.axis('off')

            if column == 1:
                viz_dict[plot_type](match_id=match_id, team=home_team, ax=ax)
            elif column == 2:
                viz_dict[plot_type](match_id=match_id, home_team=home_team, away_team=away_team, ax=ax)
            else:
                viz_dict[plot_type](match_id=match_id, team=away_team, ax=ax, inverse=True)


            plt.savefig(img, format='png')
            img.seek(0)
            plt.close()
            img_data = base64.b64encode(img.getvalue()).decode('utf-8')
            return jsonify({'img_data': img_data})
        
        except Exception as e:
            print(f"Error occurred: {e}")
            return jsonify({'error': 'An error occurred while generating the plot'}), 500
        

@app.route('/save_dashboard', methods=['POST'])
def save_dashboard():
    try:
        data = request.json
        dashboard = data.get('dashboard', [])
        match_id = data.get('match_id')
 
        match_data = matches[matches['match_id']==int(match_id)].iloc[0]
        home_team = match_data['home_team']
        away_team = match_data['away_team']

        
        n_rows = len(dashboard)//3+1

        height_ratios = [1] + [2 for _ in range(n_rows-1)]
        fig_height = 10 + 5 * (n_rows - 2)
        axes = [[None for _ in range(3)] for _ in range(n_rows)]

        fig = plt.figure(figsize=(25, fig_height), constrained_layout=True)
        fig.patch.set_facecolor('#0e1117')
        gs = fig.add_gridspec(nrows=n_rows, ncols=3, height_ratios=height_ratios, width_ratios=[1, 1, 1])

        for i in range(len(axes)):
            for j in range(len(axes[i])):
                axes[i][j] = fig.add_subplot(gs[i,j])
                axes[i][j].patch.set_facecolor('#0e1117') 
                axes[i][j].axis('off')

        axes[0][0].imshow(Image.open(f'./static/images/federations/{home_team}.png'))
        axes[0][2].imshow(Image.open(f'./static/images/federations/{away_team}.png'))

        home_team_text = axes[0][1].text(0.2, 0.4, home_team, fontsize=30, ha='center', fontfamily="Monospace", fontweight='bold', color='white')
        home_team_text.set_bbox(dict(facecolor=country_colors[home_team], alpha=0.5, edgecolor='white', boxstyle='round'))
        away_team_text = axes[0][1].text(0.8, 0.4, away_team, fontsize=30, ha='center', fontfamily="Monospace", fontweight='bold', color='white')
        away_team_text.set_bbox(dict(facecolor=country_colors[away_team], alpha=0.5, edgecolor='white', boxstyle='round'))
        axes[0][1].text(
            0.5,
            0,
            f'{match_data.home_score} - {match_data.away_score}',
            fontsize=40,
            ha='center',
            fontfamily="Monospace",
            fontweight='bold',
            color='white'
        )

        for p in range(0, len(dashboard)):
            if dashboard[p] != 'None':
                i = p//3+1
                j = p%3
                if j == 0:
                    viz_dict[dashboard[p]['plotType']](match_id, home_team, axes[i][j])
                elif j == 1:
                    viz_dict[dashboard[p]['plotType']](match_id, home_team, away_team, axes[i][j])
                elif j == 2:
                    viz_dict[dashboard[p]['plotType']](match_id, away_team, axes[i][j], inverse=True)

        filename = f"{home_team}_vs_{away_team}_dashboard.png"
        plt.savefig(f'./dashboards/{filename}', format='png')

        return jsonify({'success': True})
    
    except Exception as e:
        print(f"Error occurred: {e}")
        return jsonify({'success': False}), 500


if __name__ == '__main__':
    app.run(debug=True)
